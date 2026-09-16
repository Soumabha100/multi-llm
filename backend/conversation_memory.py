"""
Conversation Memory Module (Root)

Allows direct import via `import conversation_memory` or
`from conversation_memory import get_history, add_message, clear_history, clear_user_memory`.
"""

try:
    from app.models.conversation_memory import (
        ConversationMemory,
        conversation_memory,
        get_history,
        add_message,
        add_user_message,
        add_assistant_message,
        clear_history,
        clear_user_memory,
        normalize_model_name,
    )
except ImportError:
    # Standalone execution
    import threading
    from typing import Dict, List, Optional, Union, Any

    class ChatMessage:
        def __init__(self, role: str, content: str, provider: Optional[str] = None, model_name: Optional[str] = None):
            self.role = role
            self.content = content
            self.provider = provider
            self.model_name = model_name

        def to_dict(self):
            return {"role": self.role, "content": self.content, "model_name": self.model_name}

    def normalize_model_name(model: str) -> str:
        m = str(model).lower().strip()
        if "openai" in m or "gpt" in m:
            return "openai"
        elif "claude" in m or "anthropic" in m:
            return "claude"
        elif "gemini" in m or "google" in m:
            return "gemini"
        return m

    class ConversationMemory:
        def __init__(self):
            self._memory: Dict[str, Dict[str, List[Any]]] = {}
            self._lock = threading.Lock()

        def _ensure_user_and_model(self, user_id: str, model_key: str):
            if user_id not in self._memory:
                self._memory[user_id] = {"openai": [], "claude": [], "gemini": []}
            if model_key not in self._memory[user_id]:
                self._memory[user_id][model_key] = []

        def add_message(self, user_id: str, model: str, role: str, content: str, model_name: Optional[str] = None):
            model_key = normalize_model_name(model)
            with self._lock:
                self._ensure_user_and_model(user_id, model_key)
                msg = ChatMessage(role=role, content=content, provider=model_key, model_name=model_name or model_key)
                self._memory[user_id][model_key].append(msg)
                return msg

        def add_user_message(self, user_id: str, model: str, message: str):
            return self.add_message(user_id, model, "user", message)

        def add_assistant_message(self, user_id: str, model: str, response: str, model_name: Optional[str] = None):
            return self.add_message(user_id, model, "assistant", response, model_name=model_name)

        def add_turn(self, user_id: str, model: str, user_message: str, assistant_response: str, model_name: Optional[str] = None):
            self.add_user_message(user_id, model, user_message)
            self.add_assistant_message(user_id, model, assistant_response, model_name=model_name)

        def get_history(self, user_id: str, model: str):
            model_key = normalize_model_name(model)
            with self._lock:
                if user_id not in self._memory:
                    return []
                return list(self._memory[user_id].get(model_key, []))

        def get_user_history(self, user_id: str):
            with self._lock:
                if user_id not in self._memory:
                    return {"openai": [], "claude": [], "gemini": []}
                return {m: list(msgs) for m, msgs in self._memory[user_id].items()}

        def clear_history(self, user_id: str, model: Optional[str] = None):
            with self._lock:
                if user_id not in self._memory:
                    return
                if model:
                    model_key = normalize_model_name(model)
                    if model_key in self._memory[user_id]:
                        self._memory[user_id][model_key] = []
                else:
                    self._memory[user_id] = {"openai": [], "claude": [], "gemini": []}

        def clear_user_memory(self, user_id: str):
            self.clear_history(user_id, model=None)

        def clear_all(self):
            with self._lock:
                self._memory.clear()

        def get_message_count(self, user_id: str, model: str) -> int:
            return len(self.get_history(user_id, model))

        def has_history(self, user_id: str, model: str) -> bool:
            return self.get_message_count(user_id, model) > 0

        def get_users(self) -> List[str]:
            with self._lock:
                return list(self._memory.keys())

    conversation_memory = ConversationMemory()

    def get_history(user_id: str, model: str):
        return conversation_memory.get_history(user_id, model)

    def add_message(user_id: str, model: str, role: str, content: str, model_name: Optional[str] = None):
        return conversation_memory.add_message(user_id, model, role, content, model_name=model_name)

    def add_user_message(user_id: str, model: str, message: str):
        return conversation_memory.add_user_message(user_id, model, message)

    def add_assistant_message(user_id: str, model: str, response: str, model_name: Optional[str] = None):
        return conversation_memory.add_assistant_message(user_id, model, response, model_name=model_name)

    def clear_history(user_id: str, model: Optional[str] = None):
        conversation_memory.clear_history(user_id, model)

    def clear_user_memory(user_id: str):
        conversation_memory.clear_user_memory(user_id)

__all__ = [
    "ConversationMemory",
    "conversation_memory",
    "get_history",
    "add_message",
    "add_user_message",
    "add_assistant_message",
    "clear_history",
    "clear_user_memory",
    "normalize_model_name",
]
