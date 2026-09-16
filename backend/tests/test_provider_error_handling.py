"""
Tests for Sections 17, 18, and 19:
17. PROVIDER ERROR HANDLING:
    - If OpenAI -> success, Claude -> failure, Gemini -> success,
      the application still returns: OpenAI -> answer, Claude -> error, Gemini -> answer.
    - One provider failure does NOT crash the complete /chat request.
    - Handles: missing API key, invalid API key, rate limit, timeout, provider unavailable,
      network error, invalid model, empty response.
    - No raw stack traces or secrets exposed.

18. ENVIRONMENT VARIABLES:
    - OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY.
    - .env in .gitignore.

19. REQUIREMENTS:
    - Current official SDKs in requirements.txt.
"""

import os
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from app.services.llm_manager import (
    classify_and_sanitize_error,
    ask_model,
    SUPPORTED_MODELS,
)


def test_section_17_error_classification_all_categories():
    """Verify clean classification and sanitization across all 8 required categories."""
    provider = "claude"

    # 1. Missing API key
    e1 = Exception("No API key provided or key missing.")
    msg1 = classify_and_sanitize_error(e1, provider)
    assert "missing or not configured" in msg1

    # 2. Invalid API key / Auth
    e2 = Exception("Error code: 401 - {'error': {'message': 'Invalid API Key'}}")
    msg2 = classify_and_sanitize_error(e2, provider)
    assert "Authentication failed" in msg2

    # 3. Rate limit
    e3 = Exception("Rate limit reached for requests per minute: 429")
    msg3 = classify_and_sanitize_error(e3, provider)
    assert "Rate limit exceeded" in msg3

    # 4. Timeout
    e4 = Exception("Request timed out after 30.0 seconds")
    msg4 = classify_and_sanitize_error(e4, provider)
    assert "timed out" in msg4

    # 5. Provider unavailable
    e5 = Exception("503 Service Unavailable: High server load")
    msg5 = classify_and_sanitize_error(e5, provider)
    assert "temporarily unavailable" in msg5

    # 6. Network error
    e6 = Exception("ConnectError: [Errno 111] Connection refused")
    msg6 = classify_and_sanitize_error(e6, provider)
    assert "Network connection error" in msg6

    # 7. Invalid model
    e7 = Exception("404 Model does not exist: claude-nonexistent")
    msg7 = classify_and_sanitize_error(e7, provider, "claude-nonexistent")
    assert "invalid or unsupported" in msg7

    # 8. Empty response
    e8 = Exception("Provider returned an empty response.")
    msg8 = classify_and_sanitize_error(e8, provider)
    assert "empty response" in msg8


def test_section_17_secret_redaction_and_no_stacktrace():
    """Verify secrets (sk-..., AIza...) are redacted and stack traces are suppressed."""
    leak_secret = "Unknown provider failure near sk-ant-api03-abcdef1234567890abcdef1234567890\nTraceback:\n  File foo.py line 40"
    sanitized = classify_and_sanitize_error(Exception(leak_secret), "claude")

    # Raw key must NOT be present
    assert "sk-ant-api03-abcdef" not in sanitized
    assert "[REDACTED_KEY]" in sanitized

    # Multi-line stack trace must NOT be present
    assert "Traceback" not in sanitized
    assert "\n" not in sanitized


def test_section_17_fault_isolation_partial_failure(client: TestClient):
    """
    Test Section 17 Requirement:
    If OpenAI -> success, Claude -> failure, Gemini -> success:
    /chat must still return 200 with:
    OpenAI -> answer
    Claude -> error
    Gemini -> answer
    One provider failure must NOT crash the complete /chat request.
    """
    with patch(
        "app.services.claude_service.ClaudeService.generate_response",
        side_effect=Exception("Rate limit exceeded for Claude (429)")
    ):
        response = client.post(
            "/chat",
            json={
                "message": "What is parallel processing?",
                "user_id": "test_partial_fail_user"
            }
        )

        # Must return HTTP 200 despite Claude failure
        assert response.status_code == 200
        data = response.json()
        assert "responses" in data
        responses = data["responses"]

        # OpenAI -> success with answer
        assert responses["openai"]["status"] == "success"
        assert responses["openai"]["response"] is not None
        assert len(responses["openai"]["response"]) > 0

        # Claude -> error with clean message
        assert responses["claude"]["status"] == "error"
        assert responses["claude"]["error"] is not None
        assert "Rate limit exceeded" in responses["claude"]["error"]

        # Gemini -> success with answer
        assert responses["gemini"]["status"] == "success"
        assert responses["gemini"]["response"] is not None
        assert len(responses["gemini"]["response"]) > 0


def test_section_18_env_and_gitignore():
    """Verify .env configuration and .gitignore protection."""
    # Check .gitignore exists and contains .env
    gitignore_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".gitignore")
    assert os.path.exists(gitignore_path)
    with open(gitignore_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert ".env" in content

    # Verify settings config has keys defined
    from app.config import settings
    assert hasattr(settings, "OPENAI_API_KEY")
    assert hasattr(settings, "ANTHROPIC_API_KEY")
    assert hasattr(settings, "GEMINI_API_KEY")


def test_section_19_official_sdks():
    """Verify requirements.txt contains official SDKs."""
    req_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "requirements.txt")
    assert os.path.exists(req_path)
    with open(req_path, "r", encoding="utf-8") as f:
        reqs = f.read()

    assert "openai>=" in reqs
    assert "anthropic>=" in reqs
    assert "google-genai>=" in reqs
