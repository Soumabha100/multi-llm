"""
Tests for Sections 10 & 11:
10. MEMORY BEHAVIOR:
    - User asks "What is RAG?" -> Claude answers "RAG means Retrieval-Augmented Generation..."
    - Saved inside user_id -> claude (user message + assistant answer).
    - User asks "Explain it with a real-life example."
    - Claude receives the previous Claude conversation plus the new message.

11. MODEL ISOLATION:
    - Claude history: "My favorite language is Python."
    - OpenAI must NOT automatically receive that Claude history.
    - OpenAI history != Claude history
    - Claude history != Gemini history
    - Gemini history != OpenAI history
    - User A history != User B history
"""

import pytest
from fastapi.testclient import TestClient
from app.models.conversation_memory import (
    ConversationMemory,
    conversation_memory,
    add_user_message,
    add_assistant_message,
    add_message,
    get_history,
    clear_user_memory,
)


def test_section_10_memory_behavior_rag_scenario():
    """
    Test Section 10:
    When user asks 'What is RAG?' and Claude answers,
    both are saved in user_id -> claude.
    When user follows up 'Explain it with a real-life example.',
    Claude receives the previous conversation plus the new message.
    """
    mem = ConversationMemory()
    user_id = "user_rag_test"

    # Turn 1: User asks "What is RAG?"
    msg1 = mem.add_user_message(user_id, "claude", "What is RAG?")
    assert msg1.role == "user"
    assert msg1.content == "What is RAG?"

    ans1 = mem.add_assistant_message(
        user_id,
        "claude",
        "RAG means Retrieval-Augmented Generation, an AI architecture that combines search with LLM generation.",
        model_name="claude-3-5-sonnet"
    )
    assert ans1.role == "assistant"
    assert "Retrieval-Augmented Generation" in ans1.content

    # Verify Turn 1 is saved inside user_id -> claude
    claude_history_turn1 = mem.get_history(user_id, "claude")
    assert len(claude_history_turn1) == 2
    assert claude_history_turn1[0].content == "What is RAG?"
    assert "Retrieval-Augmented Generation" in claude_history_turn1[1].content

    # Turn 2: User asks "Explain it with a real-life example."
    # We retrieve the existing history to pass to Claude along with the new message
    context_to_send_claude = list(claude_history_turn1)
    msg2 = mem.add_user_message(user_id, "claude", "Explain it with a real-life example.")
    context_to_send_claude.append(msg2)

    # Verify Claude receives previous conversation + new message (3 messages)
    assert len(context_to_send_claude) == 3
    assert context_to_send_claude[0].content == "What is RAG?"
    assert "Retrieval-Augmented Generation" in context_to_send_claude[1].content
    assert context_to_send_claude[2].content == "Explain it with a real-life example."

    # Claude generates answer
    ans2 = mem.add_assistant_message(
        user_id,
        "claude",
        "Imagine an open-book exam where the student retrieves facts from a textbook before answering.",
        model_name="claude-3-5-sonnet"
    )

    # Full Claude history now contains 4 messages
    claude_history_turn2 = mem.get_history(user_id, "claude")
    assert len(claude_history_turn2) == 4
    assert claude_history_turn2[2].content == "Explain it with a real-life example."
    assert "open-book exam" in claude_history_turn2[3].content


def test_section_11_model_isolation_python_preference():
    """
    Test Section 11:
    If Claude history has 'My favorite language is Python.',
    OpenAI must NOT automatically receive that Claude history.
    OpenAI history != Claude history != Gemini history.
    """
    mem = ConversationMemory()
    user_id = "user_python_coder"

    # User tells Claude their favorite language
    mem.add_user_message(user_id, "claude", "My favorite language is Python.")
    mem.add_assistant_message(user_id, "claude", "Python is great for AI, data science, and web development!")

    # Verify Claude history has the message
    claude_hist = mem.get_history(user_id, "claude")
    assert len(claude_hist) == 2
    assert "My favorite language is Python." in claude_hist[0].content

    # Check OpenAI history: MUST NOT contain Claude's history
    openai_hist = mem.get_history(user_id, "openai")
    assert len(openai_hist) == 0

    # User asks OpenAI an unrelated question
    mem.add_user_message(user_id, "openai", "What is the capital of France?")
    mem.add_assistant_message(user_id, "openai", "The capital of France is Paris.")

    openai_hist_after = mem.get_history(user_id, "openai")
    assert len(openai_hist_after) == 2

    # CRITICAL CHECK: OpenAI history does NOT contain "My favorite language is Python."
    openai_contents = [m.content for m in openai_hist_after]
    for c in openai_contents:
        assert "My favorite language is Python." not in c
        assert "Python is great" not in c

    # Check Gemini history: MUST NOT contain Claude's or OpenAI's history
    gemini_hist = mem.get_history(user_id, "gemini")
    assert len(gemini_hist) == 0

    # User asks Gemini another question
    mem.add_user_message(user_id, "gemini", "Explain quantum computing briefly.")
    mem.add_assistant_message(user_id, "gemini", "Quantum computing uses qubits.")

    gemini_hist_after = mem.get_history(user_id, "gemini")
    assert len(gemini_hist_after) == 2

    # CRITICAL CHECK: Pairwise inequality
    # OpenAI history != Claude history
    assert [m.content for m in openai_hist_after] != [m.content for m in claude_hist]
    # Claude history != Gemini history
    assert [m.content for m in claude_hist] != [m.content for m in gemini_hist_after]
    # Gemini history != OpenAI history
    assert [m.content for m in gemini_hist_after] != [m.content for m in openai_hist_after]


def test_section_11_user_isolation_user_a_vs_user_b():
    """
    Test Section 11:
    User A history != User B history.
    User A's conversations are never visible or passed to User B.
    """
    mem = ConversationMemory()
    user_a = "User_A"
    user_b = "User_B"

    # User A interacts with Claude
    mem.add_user_message(user_a, "claude", "Confidential project code: OMEGA-99.")
    mem.add_assistant_message(user_a, "claude", "Understood, project OMEGA-99 noted.")

    # User B interacts with Claude
    mem.add_user_message(user_b, "claude", "Can you help me write an essay about dogs?")
    mem.add_assistant_message(user_b, "claude", "Sure! Dogs are faithful companions.")

    user_a_claude = mem.get_history(user_a, "claude")
    user_b_claude = mem.get_history(user_b, "claude")

    # Histories are strictly unequal
    assert [m.content for m in user_a_claude] != [m.content for m in user_b_claude]

    # User B's history contains ZERO User A confidential information
    user_b_contents = [m.content for m in user_b_claude]
    for c in user_b_contents:
        assert "OMEGA-99" not in c
        assert "Confidential" not in c

    # User A's history contains ZERO User B essay prompt
    user_a_contents = [m.content for m in user_a_claude]
    for c in user_a_contents:
        assert "essay about dogs" not in c


def test_e2e_api_memory_behavior_and_isolation(client: TestClient):
    """
    End-to-end API test demonstrating:
    1. Turn 1 with /chat ("What is RAG?") saves in user_id -> claude.
    2. Turn 2 with /continue (selected_model="claude", "Explain it with a real-life example.")
       passes Claude's previous context to Claude.
    3. Model Isolation: OpenAI and Gemini do NOT receive Turn 2.
    4. Model Isolation: Continuing with OpenAI only receives OpenAI's history.
    """
    user_id = "user_e2e_isolation_test"

    # Turn 1: Broadcast "What is RAG?"
    r1 = client.post(
        "/chat",
        json={
            "message": "What is RAG?",
            "user_id": user_id
        }
    )
    assert r1.status_code == 200
    session_id = r1.json()["session_id"]

    # In conversation_memory, each model has 2 messages (1 user, 1 assistant)
    assert conversation_memory.get_message_count(user_id, "openai") == 2
    assert conversation_memory.get_message_count(user_id, "claude") == 2
    assert conversation_memory.get_message_count(user_id, "gemini") == 2

    # Turn 2: Continue ONLY with Claude
    r2 = client.post(
        "/continue",
        json={
            "session_id": session_id,
            "selected_model": "claude",
            "message": "Explain it with a real-life example.",
            "user_id": user_id
        }
    )
    assert r2.status_code == 200
    claude_history = r2.json()["history"]

    # Claude received the previous Claude turn + new turn = 4 messages total
    assert len(claude_history) == 4
    assert claude_history[0]["content"] == "What is RAG?"
    assert claude_history[2]["content"] == "Explain it with a real-life example."

    # CRITICAL CHECK: OpenAI and Gemini were NOT given this message!
    assert conversation_memory.get_message_count(user_id, "openai") == 2
    assert conversation_memory.get_message_count(user_id, "gemini") == 2

    # Turn 3: Continue with OpenAI
    r3 = client.post(
        "/continue",
        json={
            "session_id": session_id,
            "selected_model": "openai",
            "message": "Give me a one-word answer: yes or no.",
            "user_id": user_id
        }
    )
    assert r3.status_code == 200
    openai_history = r3.json()["history"]

    # OpenAI history has its Turn 1 + Turn 3 = 4 messages total
    assert len(openai_history) == 4
    assert openai_history[0]["content"] == "What is RAG?"
    assert openai_history[2]["content"] == "Give me a one-word answer: yes or no."

    # CRITICAL CHECK: OpenAI history NEVER received "Explain it with a real-life example."
    openai_texts = [m["content"] for m in openai_history]
    for text in openai_texts:
        assert "real-life example" not in text

    # Verify GET /history with user_id and provider filter
    h_claude = client.get(f"/history?user_id={user_id}&provider=claude")
    assert h_claude.status_code == 200
    assert len(h_claude.json()["messages"]) == 4

    h_gemini = client.get(f"/history?user_id={user_id}&provider=gemini")
    assert h_gemini.status_code == 200
    assert len(h_gemini.json()["messages"]) == 2
