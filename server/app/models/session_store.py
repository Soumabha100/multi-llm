import uuid
import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.common import ModelProvider, ChatRole, ChatMessage


class SessionData(BaseModel):
    session_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_activity: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    system_prompt: Optional[str] = None
    # Independent histories for each provider: openai, claude, gemini
    histories: Dict[str, List[ChatMessage]] = Field(
        default_factory=lambda: {
            ModelProvider.OPENAI.value: [],
            ModelProvider.CLAUDE.value: [],
            ModelProvider.GEMINI.value: []
        }
    )


class SessionStore:
    """
    Thread-safe in-memory store maintaining per-session and per-model conversation histories.
    """

    def __init__(self):
        self._sessions: Dict[str, SessionData] = {}
        self._lock = threading.Lock()

    def get_or_create(self, session_id: Optional[str] = None, system_prompt: Optional[str] = None) -> SessionData:
        with self._lock:
            if not session_id or session_id not in self._sessions:
                sid = session_id or str(uuid.uuid4())
                session = SessionData(
                    session_id=sid,
                    system_prompt=system_prompt,
                    histories={
                        ModelProvider.OPENAI.value: [],
                        ModelProvider.CLAUDE.value: [],
                        ModelProvider.GEMINI.value: []
                    }
                )
                self._sessions[sid] = session
                return session

            session = self._sessions[session_id]
            if system_prompt and not session.system_prompt:
                session.system_prompt = system_prompt
            session.last_activity = datetime.now(timezone.utc)
            return session

    def add_user_message_to_all(self, session_id: str, message: str) -> None:
        """Add user message to all models' histories in the session (for /chat)."""
        with self._lock:
            session = self._sessions.get(session_id)
            if not session:
                return
            msg = ChatMessage(role=ChatRole.USER, content=message)
            for provider_key in session.histories:
                session.histories[provider_key].append(msg)
            session.last_activity = datetime.now(timezone.utc)

    def add_user_message_to_provider(self, session_id: str, provider: str, message: str) -> None:
        """Add user message to only one selected model's history (for /continue)."""
        with self._lock:
            session = self._sessions.get(session_id)
            if not session:
                return
            if provider not in session.histories:
                session.histories[provider] = []
            msg = ChatMessage(role=ChatRole.USER, content=message)
            session.histories[provider].append(msg)
            session.last_activity = datetime.now(timezone.utc)

    def add_assistant_response(
        self, session_id: str, provider: str, model_name: str, content: str
    ) -> ChatMessage:
        """Record model response into that provider's history."""
        with self._lock:
            session = self._sessions.get(session_id)
            if not session:
                raise KeyError(f"Session '{session_id}' not found.")
            if provider not in session.histories:
                session.histories[provider] = []

            msg = ChatMessage(
                role=ChatRole.ASSISTANT,
                content=content,
                provider=ModelProvider(provider),
                model_name=model_name,
            )
            session.histories[provider].append(msg)
            session.last_activity = datetime.now(timezone.utc)
            return msg

    def get_history(self, session_id: str, provider: Optional[str] = None) -> List[ChatMessage]:
        with self._lock:
            session = self._sessions.get(session_id)
            if not session:
                return []
            if provider:
                return list(session.histories.get(provider, []))
            return []

    def get_session(self, session_id: str) -> Optional[SessionData]:
        with self._lock:
            return self._sessions.get(session_id)

    def clear_session(self, session_id: str) -> bool:
        with self._lock:
            if session_id in self._sessions:
                del self._sessions[session_id]
                return True
            return False

    def list_active_sessions(self) -> List[str]:
        with self._lock:
            return list(self._sessions.keys())


# Singleton instance
session_store = SessionStore()
