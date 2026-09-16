import uuid
import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.common import ModelProvider, ChatRole, ChatMessage
from app.models.conversation_memory import conversation_memory


class SessionData(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_activity: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    system_prompt: Optional[str] = None
    # Independent histories for each provider: openai, claude, gemini
    histories: Dict[str, List[ChatMessage]] = Field(
        default_factory=lambda: {
            ModelProvider.TOKENHARBOR.value: [],
            ModelProvider.OPENROUTER.value: [],
            ModelProvider.GEMINI.value: []
        }
    )


class SessionStore:
    """
    Thread-safe in-memory store maintaining per-session and per-model conversation histories,
    system prompt management, and user session indexing.
    """

    def __init__(self):
        self._sessions: Dict[str, SessionData] = {}
        self._lock = threading.Lock()

    def get_or_create(
        self,
        session_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> SessionData:
        with self._lock:
            if not session_id or session_id not in self._sessions:
                sid = session_id or str(uuid.uuid4())
                session = SessionData(
                    session_id=sid,
                    user_id=user_id,
                    system_prompt=system_prompt,
                    histories={
                        ModelProvider.TOKENHARBOR.value: [],
                        ModelProvider.OPENROUTER.value: [],
                        ModelProvider.GEMINI.value: []
                    }
                )
                self._sessions[sid] = session
                return session

            session = self._sessions[session_id]
            if user_id and not session.user_id:
                session.user_id = user_id
            if system_prompt is not None:
                session.system_prompt = system_prompt
            session.last_activity = datetime.now(timezone.utc)
            return session

    def set_system_prompt(self, session_id: str, system_prompt: Optional[str]) -> None:
        """Update system prompt for an active session."""
        with self._lock:
            session = self._sessions.get(session_id)
            if session:
                session.system_prompt = system_prompt
                session.last_activity = datetime.now(timezone.utc)

    def get_system_prompt(self, session_id: str) -> Optional[str]:
        """Retrieve the configured system prompt for a session."""
        with self._lock:
            session = self._sessions.get(session_id)
            return session.system_prompt if session else None

    def add_user_message_to_all(self, session_id: str, message: str) -> None:
        """Add user message to all models' histories in the session (for /chat)."""
        with self._lock:
            session = self._sessions.get(session_id)
            if not session:
                return
            msg = ChatMessage(role=ChatRole.USER, content=message)
            for provider_key in session.histories:
                session.histories[provider_key].append(msg)
                if session.user_id:
                    conversation_memory.add_user_message(session.user_id, provider_key, message)
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
            if session.user_id:
                conversation_memory.add_user_message(session.user_id, provider, message)
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
            if session.user_id:
                conversation_memory.add_assistant_message(
                    session.user_id, provider, content, model_name=model_name
                )
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

    def get_sessions_by_user(self, user_id: str) -> List[SessionData]:
        """List all active sessions associated with a specific user_id."""
        with self._lock:
            return [s for s in self._sessions.values() if s.user_id == user_id]

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
