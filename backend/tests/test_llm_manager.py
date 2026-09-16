"""
Tests for LLM Manager Module and /chat Integration (Sections 12 & 13).

Verifies:
1. ask_model("openai", user_id, message) -> OpenAI service.
2. ask_model("claude", user_id, message) -> Claude service.
3. ask_model("gemini", user_id, message) -> Gemini service.
4. Error handling for unsupported models.
5. Integration with /chat:
   React -> POST /chat -> FastAPI -> LLM Manager -> OpenAI + Claude + Gemini -> FastAPI -> React.
6. Verification that NO placeholder text ("AI response coming soon") is returned.
"""

import pytest
from fastapi.testclient import TestClient
from app.services.llm_manager import (
    LLMManager,
    llm_manager,
    ask_model,
    LLMResponse,
)


@pytest.mark.asyncio
async def test_ask_model_openai():
    """Verify ask_model dispatches to OpenAI service and returns valid LLMResponse."""
    user_id = "user_llm_mgr_openai"
    res = await ask_model("openai", user_id, "What is photosynthesis?")

    assert isinstance(res, dict)
    assert isinstance(res, LLMResponse)
    assert res.status == "success"
    assert res["status"] == "success"
    assert res.provider == "openai"
    assert res["provider"] == "openai"
    assert len(res.response) > 0
    assert len(res.answer) > 0
    assert "AI response coming soon" not in res.response


@pytest.mark.asyncio
async def test_ask_model_claude():
    """Verify ask_model dispatches to Claude service and returns valid LLMResponse."""
    user_id = "user_llm_mgr_claude"
    res = await ask_model("claude", user_id, "Explain dark matter.")

    assert res.status == "success"
    assert res.provider == "claude"
    assert len(res.response) > 0
    assert len(res.answer) > 0
    assert "AI response coming soon" not in res.response


@pytest.mark.asyncio
async def test_ask_model_gemini():
    """Verify ask_model dispatches to Gemini service and returns valid LLMResponse."""
    user_id = "user_llm_mgr_gemini"
    res = await ask_model("gemini", user_id, "Summarize thermodynamics.")

    assert res.status == "success"
    assert res.provider == "gemini"
    assert len(res.response) > 0
    assert len(res.answer) > 0
    assert "AI response coming soon" not in res.response


@pytest.mark.asyncio
async def test_ask_model_unsupported():
    """Verify ask_model gracefully handles unknown model providers."""
    res = await ask_model("unknown_provider", "user1", "Hello")
    assert res.status == "error"
    assert "Unsupported" in res.error


def test_import_compatibility():
    """Verify llm_manager can be imported from root, app, and app.services."""
    import llm_manager as root_lm
    assert hasattr(root_lm, "ask_model")
    assert hasattr(root_lm, "llm_manager")

    from app import llm_manager as app_lm
    assert hasattr(app_lm, "ask_model")

    from app.services import llm_manager as services_lm
    assert hasattr(services_lm, "ask_model")


def test_react_fastapi_chat_flow(client: TestClient):
    """
    Test Section 13 full flow:
    React -> POST /chat -> FastAPI -> LLM Manager -> OpenAI + Claude + Gemini -> FastAPI -> React
    """
    user_id = "react_client_user"
    user_query = "What is the difference between synchronous and asynchronous programming?"

    response = client.post(
        "/chat",
        json={
            "message": user_query,
            "user_id": user_id
        }
    )
    assert response.status_code == 200
    data = response.json()

    # Verify FastAPI returned expected structure to React
    assert "session_id" in data
    assert data["user_id"] == user_id
    assert data["user_message"] == user_query
    assert "system_prompt" in data
    assert "responses" in data

    responses = data["responses"]
    assert "openai" in responses
    assert "claude" in responses
    assert "gemini" in responses

    # Verify all 3 LLMs produced actual responses, not placeholders
    for model_key in ["openai", "claude", "gemini"]:
        model_item = responses[model_key]
        assert model_item["status"] in ["success", "error"]
        assert model_item["provider"] == model_key
        assert len(model_item["model"]) > 0
        if model_item["status"] == "success":
            assert model_item["response"] is not None
            assert len(model_item["response"]) > 0
            assert "AI response coming soon" not in model_item["response"]


@pytest.mark.asyncio
async def test_section_14_parallel_gather_architecture():
    """
    Test Section 14:
    Verifies that backend orchestration executes parallel dispatch using:
    results = await asyncio.gather(
        ask_model("openai", user_id, message),
        ask_model("claude", user_id, message),
        ask_model("gemini", user_id, message),
        return_exceptions=True
    )
    """
    import asyncio
    user_id = "user_parallel_arch_test"
    message = "Compare functional and object-oriented programming."

    results = await asyncio.gather(
        ask_model("openai", user_id, message),
        ask_model("claude", user_id, message),
        ask_model("gemini", user_id, message),
        return_exceptions=True
    )

    assert len(results) == 3
    for res, expected_provider in zip(results, ["openai", "claude", "gemini"]):
        assert not isinstance(res, Exception)
        assert res.status == "success"
        assert res.provider == expected_provider
        assert len(res.response) > 0


def test_section_15_continue_calls_only_claude(client: TestClient):
    """
    Test Section 15:
    POST /continue should eventually call:
        await ask_model(model, user_id, message)
    Example:
        await ask_model("claude", "user123", "Explain it with an example.")
    Only Claude should be called. Do NOT call OpenAI and Gemini.
    """
    from app.models.conversation_memory import conversation_memory

    user_id = "user_continue_only_claude"

    # Step 1: Initial chat broadcast
    r1 = client.post(
        "/chat",
        json={
            "message": "What is reinforcement learning?",
            "user_id": user_id
        }
    )
    assert r1.status_code == 200
    session_id = r1.json()["session_id"]

    # Each model has 1 turn (user + assistant)
    assert conversation_memory.get_message_count(user_id, "openai") == 2
    assert conversation_memory.get_message_count(user_id, "claude") == 2
    assert conversation_memory.get_message_count(user_id, "gemini") == 2

    # Step 2: Continue ONLY with Claude
    r2 = client.post(
        "/continue",
        json={
            "session_id": session_id,
            "selected_model": "claude",
            "message": "Explain it with an example.",
            "user_id": user_id
        }
    )
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["selected_model"] == "claude"
    assert len(d2["history"]) == 4

    # CRITICAL VERIFICATION:
    # Only Claude grew to 4 messages.
    # OpenAI and Gemini MUST NOT have been called or modified!
    assert conversation_memory.get_message_count(user_id, "claude") == 4
    assert conversation_memory.get_message_count(user_id, "openai") == 2
    assert conversation_memory.get_message_count(user_id, "gemini") == 2


def test_section_16_model_validation():
    """
    Test Section 16:
    SUPPORTED_MODELS = {"openai", "claude", "gemini"}
    If an unsupported model is received, return a clean error without calling any provider.
    """
    from app.services.llm_manager import SUPPORTED_MODELS

    # Verify the exact set of supported models
    assert SUPPORTED_MODELS == {"openai", "claude", "gemini"}

    # Verify ask_model returns clean error for unknown model
    import asyncio
    res = asyncio.run(ask_model("llama-3", "user_val", "Hello Llama"))
    assert res.status == "error"
    assert "Unsupported model" in res.error
    assert "llama-3" in res.error
    assert "openai, claude, gemini" in res.error or "claude, gemini, openai" in res.error


def test_section_16_continue_unsupported_model(client: TestClient):
    """
    Test Section 16:
    Calling /continue with unsupported model returns clean error without provider invocation.
    """
    # Create valid session first
    r = client.post("/chat", json={"message": "Setup session", "user_id": "u_val_test"})
    assert r.status_code == 200
    session_id = r.json()["session_id"]

    # Post continue with invalid model
    r_bad = client.post(
        "/continue",
        json={
            "session_id": session_id,
            "selected_model": "deepseek-v3",
            "message": "Hello invalid model"
        }
    )
    # FastAPI schema enum validation catches invalid provider with 422
    assert r_bad.status_code in [400, 422]

