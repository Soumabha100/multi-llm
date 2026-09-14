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
    assert "openai" in data["available_providers"]
    assert "claude" in data["available_providers"]
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
    assert "openai" in responses
    assert "claude" in responses
    assert "gemini" in responses

    for provider in ["openai", "claude", "gemini"]:
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

    # Second turn: continue specifically with Claude
    r2 = client.post(
        "/continue",
        json={
            "session_id": session_id,
            "selected_model": "claude",
            "message": "Give me a code snippet."
        }
    )
    assert r2.status_code == 200
    continue_data = r2.json()
    assert continue_data["session_id"] == session_id
    assert continue_data["selected_model"] == "claude"
    assert len(continue_data["response"]) > 0
    # History should contain user1, claude1, user2, claude2
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
    assert "openai" in data["histories"]
    assert "claude" in data["histories"]
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
