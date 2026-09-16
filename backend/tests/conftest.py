import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.session_store import session_store


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_store():
    session_store._sessions.clear()
    yield
    session_store._sessions.clear()
