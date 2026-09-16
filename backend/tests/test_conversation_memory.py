"""
Tests for Conversation Memory Module.

Verifies:
1. Strict separation of conversation history by: user_id + model.
2. Structural compliance with:
   user123
   │
   ├── openai
   │     ├── user message
   │     └── OpenAI answer
   │
   ├── claude
   │     ├── user message
   │     └── Claude answer
   │
   └── gemini
         ├── user message
         └── Gemini answer
3. Models do NOT share a common history.
4. Independent isolation across multiple user_ids.
5. End-to-end integration via /chat and /continue endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.models.conversation_memory import (
    ConversationMemory,
    conversation_memory,
    add_user_message,
    add_assistant_message,
    get_history,
    clear_history,
)


def test_conversation_memory_isolated_hierarchy():
    """
    Verifies that for a user (e.g. user123), openai, claude, and gemini
    each have completely independent histories.
    """
    mem = ConversationMemory()
    user_id = "user123"

    # Add interaction to OpenAI
    mem.add_user_message(user_id, "openai", "Hello OpenAI")
    mem.add_assistant_message(user_id, "openai", "Hello! I am GPT-4o.", model_name="gpt-4o-mini")

    # Add interaction to Claude
    mem.add_user_message(user_id, "claude", "Hello Claude")
    mem.add_assistant_message(user_id, "claude", "Greetings! I am Claude 3.5.", model_name="claude-3-5-sonnet")

    # Add interaction to Gemini
    mem.add_user_message(user_id, "gemini", "Hello Gemini")
    mem.add_assistant_message(user_id, "gemini", "Hi! I am Gemini 1.5.", model_name="gemini-1.5-flash")

    # Verify OpenAI history
    openai_hist = mem.get_history(user_id, "openai")
    assert len(openai_hist) == 2
    assert openai_hist[0].role == "user"
    assert openai_hist[0].content == "Hello OpenAI"
    assert openai_hist[1].role == "assistant"
    assert openai_hist[1].content == "Hello! I am GPT-4o."

    # Verify Claude history
    claude_hist = mem.get_history(user_id, "claude")
    assert len(claude_hist) == 2
    assert claude_hist[0].role == "user"
    assert claude_hist[0].content == "Hello Claude"
    assert claude_hist[1].role == "assistant"
    assert claude_hist[1].content == "Greetings! I am Claude 3.5."

    # Verify Gemini history
    gemini_hist = mem.get_history(user_id, "gemini")
    assert len(gemini_hist) == 2
    assert gemini_hist[0].role == "user"
    assert gemini_hist[0].content == "Hello Gemini"
    assert gemini_hist[1].role == "assistant"
    assert gemini_hist[1].content == "Hi! I am Gemini 1.5."

    # Continue ONLY Claude conversation
    mem.add_user_message(user_id, "claude", "Can you explain recursion?")
    mem.add_assistant_message(user_id, "claude", "Recursion is when a function calls itself.")

    # CRITICAL CHECK: Ensure Claude grew to 4 messages, while OpenAI and Gemini remain at 2
    assert len(mem.get_history(user_id, "claude")) == 4
    assert len(mem.get_history(user_id, "openai")) == 2
    assert len(mem.get_history(user_id, "gemini")) == 2

    # Verify that OpenAI history contains NO Claude messages
    for msg in mem.get_history(user_id, "openai"):
        assert "Claude" not in msg.content
        assert "recursion" not in msg.content.lower()

    # Verify that Gemini history contains NO Claude messages
    for msg in mem.get_history(user_id, "gemini"):
        assert "Claude" not in msg.content
        assert "recursion" not in msg.content.lower()


def test_multi_user_isolation():
    """Verify that multiple users have completely isolated memory structures."""
    mem = ConversationMemory()

    mem.add_turn("alice", "openai", "Alice query", "OpenAI response to Alice")
    mem.add_turn("bob", "openai", "Bob query", "OpenAI response to Bob")

    alice_hist = mem.get_history("alice", "openai")
    bob_hist = mem.get_history("bob", "openai")

    assert len(alice_hist) == 2
    assert len(bob_hist) == 2
    assert alice_hist[0].content == "Alice query"
    assert bob_hist[0].content == "Bob query"

    # Bob's claude history should be completely empty
    assert len(mem.get_history("bob", "claude")) == 0


def test_clear_memory_operations():
    """Verify clearing a single model's history vs entire user history."""
    mem = ConversationMemory()
    u = "user_clear_test"

    mem.add_turn(u, "openai", "OpenAI Q", "OpenAI A")
    mem.add_turn(u, "claude", "Claude Q", "Claude A")
    mem.add_turn(u, "gemini", "Gemini Q", "Gemini A")

    assert mem.get_message_count(u, "openai") == 2
    assert mem.get_message_count(u, "claude") == 2
    assert mem.get_message_count(u, "gemini") == 2

    # Clear only OpenAI
    mem.clear_history(u, "openai")
    assert mem.get_message_count(u, "openai") == 0
    assert mem.get_message_count(u, "claude") == 2
    assert mem.get_message_count(u, "gemini") == 2

    # Clear all for user
    mem.clear_history(u)
    assert mem.get_message_count(u, "claude") == 0
    assert mem.get_message_count(u, "gemini") == 0


def test_import_compatibility():
    """Verify conversation_memory can be imported from root, app, app.models, and app.services."""
    import conversation_memory as root_cm
    assert hasattr(root_cm, "ConversationMemory")
    assert hasattr(root_cm, "conversation_memory")
    assert hasattr(root_cm, "get_history")

    from app import conversation_memory as app_cm
    assert hasattr(app_cm, "ConversationMemory")
    assert hasattr(app_cm, "get_history")

    from app.models import conversation_memory as models_cm
    assert hasattr(models_cm, "ConversationMemory")
    assert hasattr(models_cm, "get_history")

    from app.services import conversation_memory as services_cm
    assert hasattr(services_cm, "ConversationMemory")
    assert hasattr(services_cm, "get_history")


def test_api_e2e_user_memory_tracking(client: TestClient):
    """
    End-to-end integration test verifying that /chat and /continue
    populate conversation_memory per user_id + model without sharing history.
    """
    user_id = "test-uid-8888"

    # First turn: broadcast to all 3 models
    r1 = client.post(
        "/chat",
        json={
            "message": "What is 2 + 2?",
            "user_id": user_id
        }
    )
    assert r1.status_code == 200
    session_id = r1.json()["session_id"]

    # Check conversation_memory for user_id
    openai_h = conversation_memory.get_history(user_id, "openai")
    claude_h = conversation_memory.get_history(user_id, "claude")
    gemini_h = conversation_memory.get_history(user_id, "gemini")

    assert len(openai_h) == 2  # user + assistant
    assert len(claude_h) == 2  # user + assistant
    assert len(gemini_h) == 2  # user + assistant

    # Second turn: continue ONLY with gemini
    r2 = client.post(
        "/continue",
        json={
            "session_id": session_id,
            "selected_model": "gemini",
            "message": "And what is 4 * 4?",
            "user_id": user_id
        }
    )
    assert r2.status_code == 200

    # CRITICAL CHECK: Gemini history grew to 4, OpenAI and Claude remain at 2
    assert conversation_memory.get_message_count(user_id, "gemini") == 4
    assert conversation_memory.get_message_count(user_id, "openai") == 2
    assert conversation_memory.get_message_count(user_id, "claude") == 2


def test_requested_clean_memory_functions():
    """
    Explicitly tests the 4 requested functions:
    - get_history(user_id, model)
    - add_message(user_id, model, role, content)
    - clear_history(user_id, model)
    - clear_user_memory(user_id)
    """
    from app.models.conversation_memory import (
        get_history,
        add_message,
        clear_history,
        clear_user_memory,
    )

    test_user = "clean_func_user"

    # Initially empty
    assert get_history(test_user, "openai") == []
    assert get_history(test_user, "claude") == []

    # add_message to openai
    msg1 = add_message(test_user, "openai", "user", "What is AI?")
    assert msg1.role == "user"
    assert msg1.content == "What is AI?"

    msg2 = add_message(test_user, "openai", "assistant", "AI stands for Artificial Intelligence.")
    assert msg2.role == "assistant"
    assert msg2.content == "AI stands for Artificial Intelligence."

    # add_message to claude
    msg3 = add_message(test_user, "claude", "user", "Explain Python.")
    msg4 = add_message(test_user, "claude", "assistant", "Python is a programming language.")

    # get_history checks
    openai_h = get_history(test_user, "openai")
    claude_h = get_history(test_user, "claude")
    assert len(openai_h) == 2
    assert len(claude_h) == 2
    assert openai_h[0].content == "What is AI?"
    assert claude_h[0].content == "Explain Python."

    # clear_history(user_id, model) for openai only
    clear_history(test_user, "openai")
    assert get_history(test_user, "openai") == []
    assert len(get_history(test_user, "claude")) == 2

    # clear_user_memory(user_id) clears everything for that user
    clear_user_memory(test_user)
    assert get_history(test_user, "openai") == []
    assert get_history(test_user, "claude") == []
