import pytest
from fastapi.testclient import TestClient


def test_root_endpoint(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "docs_url" in data


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "configured_models" in data
    assert "tokenharbor" in data["available_providers"]
    assert "openrouter" in data["available_providers"]
    assert "gemini" in data["available_providers"]


def test_parallel_chat(client: TestClient):
    response = client.post(
        "/chat",
        json={"message": "Explain quantum computing in one sentence."}
    )
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert data["user_message"] == "Explain quantum computing in one sentence."
    assert "responses" in data
    
    responses = data["responses"]
    assert "tokenharbor" in responses
    assert "openrouter" in responses
    assert "gemini" in responses

    for provider in ["tokenharbor", "openrouter", "gemini"]:
        item = responses[provider]
        assert item["status"] in ["success", "error"]
        assert item["provider"] == provider
        assert len(item["model"]) > 0
        if item["status"] == "success":
            assert item["response"] is not None


def test_continue_conversation(client: TestClient):
    # First turn: broadcast to all
    r1 = client.post("/chat", json={"message": "What is Python?"})
    assert r1.status_code == 200
    session_id = r1.json()["session_id"]

    # Second turn: continue specifically with OpenRouter
    r2 = client.post(
        "/continue",
        json={
            "session_id": session_id,
            "selected_model": "openrouter",
            "message": "Give me a code snippet."
        }
    )
    assert r2.status_code == 200
    continue_data = r2.json()
    assert continue_data["session_id"] == session_id
    assert continue_data["selected_model"] == "openrouter"
    assert len(continue_data["response"]) > 0
    # History should contain user1, openrouter1, user2, openrouter2
    assert len(continue_data["history"]) >= 4


def test_history_endpoint(client: TestClient):
    # Test empty /history lists active sessions
    r0 = client.get("/history")
    assert r0.status_code == 200
    assert "active_session_ids" in r0.json()

    r1 = client.post("/chat", json={"message": "Hello world!"})
    assert r1.status_code == 200
    session_id = r1.json()["session_id"]

    # Path parameter test: /history/{session_id}
    r2 = client.get(f"/history/{session_id}")
    assert r2.status_code == 200
    data = r2.json()
    assert "histories" in data
    assert "tokenharbor" in data["histories"]
    assert "openrouter" in data["histories"]
    assert "gemini" in data["histories"]

    # Query parameter test: /history?session_id=...
    r3 = client.get(f"/history?session_id={session_id}")
    assert r3.status_code == 200
    assert "histories" in r3.json()


def test_validation_errors(client: TestClient):
    # Empty message should fail with 422 Unprocessable Entity
    r1 = client.post("/chat", json={"message": ""})
    assert r1.status_code == 422

    # Invalid provider enum should fail with 422
    r2 = client.post(
        "/continue",
        json={
            "session_id": "test-session",
            "selected_model": "invalid_model_xyz",
            "message": "Hello"
        }
    )
    assert r2.status_code == 422


def test_user_id_and_system_prompt(client: TestClient):
    # Test /chat with user_id and system_prompt
    r = client.post(
        "/chat",
        json={
            "message": "Hello with system prompt",
            "user_id": "firebase-uid-12345",
            "system_prompt": "You are a concise tutor."
        }
    )
    assert r.status_code == 200
    data = r.json()
    assert data["user_id"] == "firebase-uid-12345"
    assert data["system_prompt"] == "You are a concise tutor."
    session_id = data["session_id"]

    # Test /continue inherits or updates user_id
    r2 = client.post(
        "/continue",
        json={
            "session_id": session_id,
            "selected_model": "tokenharbor",
            "message": "Second message",
            "user_id": "firebase-uid-12345"
        }
    )
    assert r2.status_code == 200
    assert r2.json()["user_id"] == "firebase-uid-12345"

    # Query history by user_id
    r3 = client.get("/history?user_id=firebase-uid-12345")
    assert r3.status_code == 200
    user_data = r3.json()
    assert user_data["user_id"] == "firebase-uid-12345"
    assert any(s["session_id"] == session_id for s in user_data["sessions"])


def test_model_alias_in_continue(client: TestClient):
    # Pass 'model' instead of 'selected_model'
    r1 = client.post("/chat", json={"message": "Initial message"})
    session_id = r1.json()["session_id"]

    r2 = client.post(
        "/continue",
        json={
            "session_id": session_id,
            "model": "gemini",
            "message": "Follow up using 'model' alias"
        }
    )
    assert r2.status_code == 200
    assert r2.json()["selected_model"] == "gemini"


@pytest.mark.asyncio
async def test_tokenharbor_ask_interface():
    from app.services.tokenharbor_service import ask, TokenHarborService

    # Test success case with simulation mode (no API key required)
    result = await ask(
        message="What is the speed of light?",
        history=[{"role": "user", "content": "Hello"}],
        system_prompt="Be concise."
    )
    assert result["model"] == "tokenharbor"
    assert result["status"] == "success"
    assert result["answer"] is not None
    assert isinstance(result["answer"], str)

    # Test empty message error handling
    err_result = await ask(message="")
    assert err_result["model"] == "tokenharbor"
    assert err_result["status"] == "error"
    assert err_result["answer"] is None
    assert "failed" in err_result["error"]

    # Test TokenHarborService.ask() instance method
    service = TokenHarborService(model_name="deepseek-v4.1-flash:free")
    res2 = await service.ask("Explain gravity")
    assert res2["model"] == "tokenharbor"
    assert res2["status"] == "success"
    assert len(res2["answer"]) > 0


@pytest.mark.asyncio
async def test_openrouter_ask_interface():
    from app.services.openrouter_service import ask, OpenRouterService

    # Test success case with simulation mode (no API key required)
    result = await ask(
        message="What is the theory of relativity?",
        history=[{"role": "user", "content": "Hi OpenRouter"}],
        system_prompt="Explain simply."
    )
    assert result["model"] == "openrouter"
    assert result["status"] == "success"
    assert result["answer"] is not None
    assert isinstance(result["answer"], str)

    # Test empty message error handling
    err_result = await ask(message="")
    assert err_result["model"] == "openrouter"
    assert err_result["status"] == "error"
    assert err_result["answer"] is None
    assert "failed" in err_result["error"]

    # Test OpenRouterService.ask() instance method
    service = OpenRouterService(model_name="nvidia/nemotron-3-ultra-550b-a55b:free")
    res2 = await service.ask("Hello from OpenRouter test")
    assert res2["model"] == "openrouter"
    assert res2["status"] == "success"
    assert len(res2["answer"]) > 0



