"""
Conversation Memory Module

Enforces isolated in-memory conversation histories separated strictly by:
    user_id + model

Conceptual hierarchy:
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

Strict Isolation Rule:
Do NOT create one common history for all models.
Each model maintains a dedicated, isolated conversation history per user.
"""

import threading
from typing import Dict, List, Optional, Union, Any

try:
    from app.schemas.common import ChatMessage, ChatRole, ModelProvider
except ImportError:
    # Standalone fallback definition for isolated testing
    from enum import Enum
    from pydantic import BaseModel, Field

    class ChatRole(str, Enum):
        USER = "user"
        ASSISTANT = "assistant"
        SYSTEM = "system"

    class ModelProvider(str, Enum):
        OPENAI = "openai"
        CLAUDE = "claude"
        GEMINI = "gemini"

    class ChatMessage(BaseModel):
        role: ChatRole
        content: str
        provider: Optional[ModelProvider] = None
        model_name: Optional[str] = None


def normalize_model_name(model: Union[str, ModelProvider]) -> str:
    """
    Normalizes model or provider input into a canonical provider key:
    'openai', 'claude', or 'gemini'.

    Args:
        model (Union[str, ModelProvider]): Model or provider identifier.

    Returns:
        str: Canonical model string ('openai', 'claude', 'gemini', or stripped lowercase).
    """
    if isinstance(model, ModelProvider):
        return model.value
    m = str(model).lower().strip()
    if "openai" in m or "gpt" in m:
        return "openai"
    elif "claude" in m or "anthropic" in m:
        return "claude"
    elif "gemini" in m or "google" in m:
        return "gemini"
    return m


class ConversationMemory:
    """
    Thread-safe in-memory store maintaining isolated conversation histories
    keyed by user_id and model.

    Structure:
    {
        "<user_id>": {
            "openai": [ChatMessage, ...],
            "claude": [ChatMessage, ...],
            "gemini": [ChatMessage, ...]
        }
    }
    """

    def __init__(self) -> None:
        # Nested mapping: user_id -> model_key -> List[ChatMessage]
        self._memory: Dict[str, Dict[str, List[ChatMessage]]] = {}
        self._lock = threading.Lock()

    def _ensure_user_and_model(self, user_id: str, model_key: str) -> None:
        """Helper to initialize nested storage if not present (must be called inside lock)."""
        if user_id not in self._memory:
            self._memory[user_id] = {
                "openai": [],
                "claude": [],
                "gemini": [],
            }
        if model_key not in self._memory[user_id]:
            self._memory[user_id][model_key] = []

    def add_message(
        self,
        user_id: str,
        model: Union[str, ModelProvider],
        role: Union[str, ChatRole],
        content: str,
        model_name: Optional[str] = None
    ) -> ChatMessage:
        """
        Adds a message to the specified model's isolated history for a given user.

        Args:
            user_id (str): Unique user identifier.
            model (Union[str, ModelProvider]): Target model (e.g. 'openai', 'claude', 'gemini').
            role (Union[str, ChatRole]): Role ('user', 'assistant', 'system' or ChatRole enum).
            content (str): Message text.
            model_name (Optional[str]): Specific model variant name (e.g. 'gpt-4o-mini').

        Returns:
            ChatMessage: The newly recorded message.
        """
        model_key = normalize_model_name(model)
        if isinstance(role, ChatRole):
            resolved_role = role
        elif isinstance(role, str) and role.lower() in [r.value for r in ChatRole]:
            resolved_role = ChatRole(role.lower())
        else:
            resolved_role = ChatRole.USER

        with self._lock:
            self._ensure_user_and_model(user_id, model_key)
            msg = ChatMessage(
                role=resolved_role,
                content=content,
                provider=ModelProvider(model_key) if model_key in ["openai", "claude", "gemini"] else None,
                model_name=model_name or model_key
            )
            self._memory[user_id][model_key].append(msg)
            return msg

    def add_user_message(
        self,
        user_id: str,
        model: Union[str, ModelProvider],
        message: str
    ) -> ChatMessage:
        """
        Appends a user message to the specific model's history for the given user_id.
        Does NOT append to other models' histories.

        Args:
            user_id (str): Unique user identifier.
            model (Union[str, ModelProvider]): Target model.
            message (str): User prompt text.

        Returns:
            ChatMessage: Recorded user message.
        """
        return self.add_message(
            user_id=user_id,
            model=model,
            role=ChatRole.USER,
            content=message
        )

    def add_assistant_message(
        self,
        user_id: str,
        model: Union[str, ModelProvider],
        response: str,
        model_name: Optional[str] = None
    ) -> ChatMessage:
        """
        Appends an assistant answer to the specific model's history for the given user_id.
        Does NOT append to other models' histories.

        Args:
            user_id (str): Unique user identifier.
            model (Union[str, ModelProvider]): Target model.
            response (str): Assistant answer text.
            model_name (Optional[str]): Model name identifier.

        Returns:
            ChatMessage: Recorded assistant message.
        """
        return self.add_message(
            user_id=user_id,
            model=model,
            role=ChatRole.ASSISTANT,
            content=response,
            model_name=model_name
        )

    def add_turn(
        self,
        user_id: str,
        model: Union[str, ModelProvider],
        user_message: str,
        assistant_response: str,
        model_name: Optional[str] = None
    ) -> None:
        """
        Adds a complete user message + assistant response turn to the chosen model.

        Args:
            user_id (str): Unique user identifier.
            model (Union[str, ModelProvider]): Target model.
            user_message (str): User input.
            assistant_response (str): Model output.
            model_name (Optional[str]): Model name identifier.
        """
        self.add_user_message(user_id=user_id, model=model, message=user_message)
        self.add_assistant_message(
            user_id=user_id,
            model=model,
            response=assistant_response,
            model_name=model_name
        )

    def get_history(
        self,
        user_id: str,
        model: Union[str, ModelProvider]
    ) -> List[ChatMessage]:
        """
        Retrieves the isolated conversation history for a specific (user_id, model) pair.
        Returns an empty list if no messages exist yet.

        Args:
            user_id (str): Unique user identifier.
            model (Union[str, ModelProvider]): Target model ('openai', 'claude', 'gemini').

        Returns:
            List[ChatMessage]: Message history list for the specified model.
        """
        model_key = normalize_model_name(model)
        with self._lock:
            if user_id not in self._memory:
                return []
            return list(self._memory[user_id].get(model_key, []))

    def get_history_dicts(
        self,
        user_id: str,
        model: Union[str, ModelProvider]
    ) -> List[Dict[str, Any]]:
        """
        Retrieves history as standard dictionaries containing 'role', 'content', and 'model_name'.

        Args:
            user_id (str): Unique user identifier.
            model (Union[str, ModelProvider]): Target model.

        Returns:
            List[Dict[str, Any]]: List of dictionary representations.
        """
        history = self.get_history(user_id, model)
        return [
            {
                "role": m.role.value if hasattr(m.role, "value") else str(m.role),
                "content": m.content,
                "model_name": m.model_name
            }
            for m in history
        ]

    def get_user_models(self, user_id: str) -> List[str]:
        """
        Returns the list of configured models for a user.

        Args:
            user_id (str): Unique user identifier.

        Returns:
            List[str]: List of model keys (e.g. ['openai', 'claude', 'gemini']).
        """
        with self._lock:
            if user_id not in self._memory:
                return []
            return list(self._memory[user_id].keys())

    def get_user_history(self, user_id: str) -> Dict[str, List[ChatMessage]]:
        """
        Returns a dictionary of all isolated model histories for a user:
        {
            "openai": [...],
            "claude": [...],
            "gemini": [...]
        }

        Args:
            user_id (str): Unique user identifier.

        Returns:
            Dict[str, List[ChatMessage]]: Mapping of model to message history.
        """
        with self._lock:
            if user_id not in self._memory:
                return {"openai": [], "claude": [], "gemini": []}
            return {
                m: list(msgs) for m, msgs in self._memory[user_id].items()
            }

    def clear_history(
        self,
        user_id: str,
        model: Optional[Union[str, ModelProvider]] = None
    ) -> None:
        """
        Clears conversation history for a specific model under user_id.
        If model is None, clears all model histories for that user.

        Args:
            user_id (str): Unique user identifier.
            model (Optional[Union[str, ModelProvider]]): Specific model to clear, or None for all.
        """
        with self._lock:
            if user_id not in self._memory:
                return
            if model:
                model_key = normalize_model_name(model)
                if model_key in self._memory[user_id]:
                    self._memory[user_id][model_key] = []
            else:
                self._memory[user_id] = {
                    "openai": [],
                    "claude": [],
                    "gemini": []
                }

    def clear_user_memory(self, user_id: str) -> None:
        """
        Clears all conversation memory across all models for the specified user_id.

        Args:
            user_id (str): Unique user identifier.
        """
        self.clear_history(user_id=user_id, model=None)

    def clear_all(self) -> None:
        """Clears all stored user and model memories."""
        with self._lock:
            self._memory.clear()

    def get_message_count(
        self,
        user_id: str,
        model: Union[str, ModelProvider]
    ) -> int:
        """
        Returns the number of messages for a given (user_id, model) stream.

        Args:
            user_id (str): Unique user identifier.
            model (Union[str, ModelProvider]): Target model.

        Returns:
            int: Message count.
        """
        return len(self.get_history(user_id, model))

    def has_history(
        self,
        user_id: str,
        model: Union[str, ModelProvider]
    ) -> bool:
        """
        Checks if any history exists for the (user_id, model) stream.

        Args:
            user_id (str): Unique user identifier.
            model (Union[str, ModelProvider]): Target model.

        Returns:
            bool: True if history is non-empty, False otherwise.
        """
        return self.get_message_count(user_id, model) > 0

    def get_users(self) -> List[str]:
        """
        Lists all user_ids tracked in memory.

        Returns:
            List[str]: List of user_id strings.
        """
        with self._lock:
            return list(self._memory.keys())


# Centralized singleton instance
conversation_memory = ConversationMemory()


# =====================================================================
# Top-level functional interface
# =====================================================================

def get_history(
    user_id: str,
    model: Union[str, ModelProvider]
) -> List[ChatMessage]:
    """
    Retrieves the isolated conversation history for a specific (user_id, model) pair.

    Args:
        user_id (str): Unique user identifier.
        model (Union[str, ModelProvider]): Target model ('openai', 'claude', 'gemini').

    Returns:
        List[ChatMessage]: Message history list for that specific model.
    """
    return conversation_memory.get_history(user_id, model)


def add_message(
    user_id: str,
    model: Union[str, ModelProvider],
    role: Union[str, ChatRole],
    content: str,
    model_name: Optional[str] = None
) -> ChatMessage:
    """
    Adds a message to the specified model's isolated history for a given user.

    Args:
        user_id (str): Unique user identifier.
        model (Union[str, ModelProvider]): Target model ('openai', 'claude', 'gemini').
        role (Union[str, ChatRole]): Message role ('user', 'assistant', 'system').
        content (str): Message text.
        model_name (Optional[str]): Specific model variant name.

    Returns:
        ChatMessage: The recorded message object.
    """
    return conversation_memory.add_message(
        user_id=user_id,
        model=model,
        role=role,
        content=content,
        model_name=model_name
    )


def add_user_message(
    user_id: str,
    model: Union[str, ModelProvider],
    message: str
) -> ChatMessage:
    """
    Appends a user message to the specified model's history for the user.

    Args:
        user_id (str): Unique user identifier.
        model (Union[str, ModelProvider]): Target model.
        message (str): User prompt text.

    Returns:
        ChatMessage: Recorded user message.
    """
    return conversation_memory.add_user_message(user_id, model, message)


def add_assistant_message(
    user_id: str,
    model: Union[str, ModelProvider],
    response: str,
    model_name: Optional[str] = None
) -> ChatMessage:
    """
    Appends an assistant response to the specified model's history for the user.

    Args:
        user_id (str): Unique user identifier.
        model (Union[str, ModelProvider]): Target model.
        response (str): Assistant answer text.
        model_name (Optional[str]): Model variant name.

    Returns:
        ChatMessage: Recorded assistant message.
    """
    return conversation_memory.add_assistant_message(
        user_id, model, response, model_name=model_name
    )


def clear_history(
    user_id: str,
    model: Optional[Union[str, ModelProvider]] = None
) -> None:
    """
    Clears the conversation history for a specific model under user_id.
    If model is None, clears all model histories for that user.

    Args:
        user_id (str): Unique user identifier.
        model (Optional[Union[str, ModelProvider]]): Target model, or None for all.
    """
    conversation_memory.clear_history(user_id, model)


def clear_user_memory(user_id: str) -> None:
    """
    Clears all conversation memory across all models for the specified user_id.

    Args:
        user_id (str): Unique user identifier.
    """
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
