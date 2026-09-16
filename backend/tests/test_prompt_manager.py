"""
Tests for Prompt Manager and System Prompt Isolation.

Verifies:
1. Centralized system prompt definition and fallback behavior.
2. get_system_prompt() functionality and signatures.
3. Import compatibility (root, app, app.services).
4. Strict separation between System Prompt and User Message.
5. Verification that system instructions are NOT concatenated into user messages.
"""

import pytest
from fastapi.testclient import TestClient
from app.schemas.common import ChatMessage, ChatRole
from app.services.prompt_manager import (
    DEFAULT_SYSTEM_PROMPT,
    SYSTEM_PROMPT,
    get_system_prompt,
    PromptManager,
    prompt_manager,
)
from app.services.openai_service import _format_history_for_openai


def test_centralized_system_prompt_content():
    """Verify that the centralized system prompt contains all required instructions."""
    expected_lines = [
        "You are a helpful AI assistant.",
        "Answer clearly and accurately.",
        "Use conversation history when relevant.",
        "Do not intentionally invent information.",
        "If you are uncertain, clearly say so.",
    ]
    prompt = get_system_prompt()
    for line in expected_lines:
        assert line in prompt, f"Expected line missing from system prompt: {line}"

    # Verify SYSTEM_PROMPT alias matches DEFAULT_SYSTEM_PROMPT
    assert SYSTEM_PROMPT == DEFAULT_SYSTEM_PROMPT
    assert prompt == DEFAULT_SYSTEM_PROMPT


def test_get_system_prompt_overrides_and_fallbacks():
    """Verify behavior with custom prompts, whitespace, and None."""
    # Zero arguments returns centralized default
    assert get_system_prompt() == DEFAULT_SYSTEM_PROMPT

    # None returns centralized default
    assert get_system_prompt(None) == DEFAULT_SYSTEM_PROMPT

    # Empty string or whitespace returns centralized default
    assert get_system_prompt("") == DEFAULT_SYSTEM_PROMPT
    assert get_system_prompt("   ") == DEFAULT_SYSTEM_PROMPT

    # Custom prompt is preserved and sanitized
    custom = "You are an expert Python tutor. Keep answers concise."
    assert get_system_prompt(custom) == custom
    assert get_system_prompt(f"  {custom}  ") == custom


def test_prompt_manager_class():
    """Verify the PromptManager instance and class utilities."""
    manager = PromptManager()
    assert manager.default_prompt == DEFAULT_SYSTEM_PROMPT
    assert manager.get_system_prompt() == DEFAULT_SYSTEM_PROMPT
    assert manager.get_system_prompt("Custom persona") == "Custom persona"

    # Test isolation utility
    isolated = PromptManager.ensure_separate_messages(
        system_prompt="Custom sys",
        user_message="Hello assistant"
    )
    assert isolated["system_prompt"] == "Custom sys"
    assert isolated["user_message"] == "Hello assistant"
    # Ensure no concatenation
    assert "Custom sys" not in isolated["user_message"]


def test_import_compatibility():
    """Verify prompt_manager can be imported from root, app, and app.services."""
    import prompt_manager as root_pm
    assert hasattr(root_pm, "get_system_prompt")
    assert root_pm.get_system_prompt() == DEFAULT_SYSTEM_PROMPT

    from app import prompt_manager as app_pm
    assert hasattr(app_pm, "get_system_prompt")
    assert app_pm.get_system_prompt() == DEFAULT_SYSTEM_PROMPT

    from app.services import prompt_manager as service_pm
    assert hasattr(service_pm, "get_system_prompt")
    assert service_pm.get_system_prompt() == DEFAULT_SYSTEM_PROMPT


def test_openai_formatter_keeps_system_and_user_separate():
    """Verify OpenAI formatter keeps system prompt separate from user message."""
    user_input = "Tell me about quantum physics."
    sys_prompt = get_system_prompt()

    formatted = _format_history_for_openai(
        history=[],
        system_prompt=sys_prompt,
        user_message=user_input
    )

    # Must contain exactly two message objects
    assert len(formatted) == 2

    # System message must be role: system
    assert formatted[0]["role"] == "system"
    assert formatted[0]["content"] == sys_prompt

    # User message must be role: user and NOT contain the system prompt
    assert formatted[1]["role"] == "user"
    assert formatted[1]["content"] == user_input
    assert sys_prompt not in formatted[1]["content"]


def test_api_chat_default_system_prompt_separation(client: TestClient):
    """Verify /chat endpoint returns user_message separate from system_prompt."""
    user_query = "What is machine learning?"
    response = client.post("/chat", json={"message": user_query})
    assert response.status_code == 200
    data = response.json()

    # User message in response should be untouched
    assert data["user_message"] == user_query
    # System prompt should be active centralized prompt
    assert data["system_prompt"] == DEFAULT_SYSTEM_PROMPT
    # Crucial check: user message must NOT contain system prompt instructions
    assert "You are a helpful AI assistant." not in data["user_message"]


def test_api_chat_custom_system_prompt_separation(client: TestClient):
    """Verify /chat with custom system prompt preserves separation."""
    custom_sys = "You are a strict math professor."
    user_query = "Calculate 15 * 4"
    response = client.post(
        "/chat",
        json={
            "message": user_query,
            "system_prompt": custom_sys
        }
    )
    assert response.status_code == 200
    data = response.json()

    assert data["user_message"] == user_query
    assert data["system_prompt"] == custom_sys
    assert custom_sys not in data["user_message"]
