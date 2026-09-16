"""
Prompt Manager Module

Centralized system prompt manager ensuring separation between system prompts
and user messages.
"""

from typing import Optional, Dict, Any

try:
    from app.services.prompt_manager import (
        DEFAULT_SYSTEM_PROMPT,
        SYSTEM_PROMPT,
        get_system_prompt,
        PromptManager,
        prompt_manager,
    )
except ImportError:
    # Standalone fallback if invoked outside package structure
    DEFAULT_SYSTEM_PROMPT: str = (
        "You are a helpful AI assistant.\n"
        "Answer clearly and accurately.\n"
        "Use conversation history when relevant.\n"
        "Do not intentionally invent information.\n"
        "If you are uncertain, clearly say so."
    )
    SYSTEM_PROMPT: str = DEFAULT_SYSTEM_PROMPT

    def get_system_prompt(custom_prompt: Optional[str] = None) -> str:
        if custom_prompt and custom_prompt.strip():
            return custom_prompt.strip()
        return DEFAULT_SYSTEM_PROMPT

    class PromptManager:
        def __init__(self, default_prompt: Optional[str] = None):
            self._default_prompt = (
                default_prompt.strip() if default_prompt and default_prompt.strip() else DEFAULT_SYSTEM_PROMPT
            )

        @property
        def default_prompt(self) -> str:
            return self._default_prompt

        def get_system_prompt(self, custom_prompt: Optional[str] = None) -> str:
            if custom_prompt and custom_prompt.strip():
                return custom_prompt.strip()
            return self._default_prompt

    prompt_manager = PromptManager()

__all__ = [
    "DEFAULT_SYSTEM_PROMPT",
    "SYSTEM_PROMPT",
    "get_system_prompt",
    "PromptManager",
    "prompt_manager",
]
