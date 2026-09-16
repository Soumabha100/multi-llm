"""
Prompt Manager Module

Provides centralized system prompts and enforces strict separation between
system instructions and user messages across all LLM providers (OpenAI, Claude, Gemini).
"""

from typing import Optional, Dict, Any, List


# Centralized system prompt defining core AI persona and guardrails
DEFAULT_SYSTEM_PROMPT: str = (
    "You are a helpful AI assistant.\n"
    "Answer clearly and accurately.\n"
    "Use conversation history when relevant.\n"
    "Do not intentionally invent information.\n"
    "If you are uncertain, clearly say so."
)

# Alias for standard access
SYSTEM_PROMPT: str = DEFAULT_SYSTEM_PROMPT


def get_system_prompt(custom_prompt: Optional[str] = None) -> str:
    """
    Returns the centralized system prompt.

    If a custom_prompt string is provided and non-empty, returns the sanitized
    custom prompt. Otherwise, returns the centralized default system prompt.

    Args:
        custom_prompt: Optional user/session-provided system prompt.

    Returns:
        str: Active system prompt to be passed to LLM services.
    """
    if custom_prompt and custom_prompt.strip():
        return custom_prompt.strip()
    return DEFAULT_SYSTEM_PROMPT


class PromptManager:
    """
    Centralized manager for system prompts, persona configurations,
    and prompt isolation utilities.
    """

    def __init__(self, default_prompt: Optional[str] = None):
        self._default_prompt = (
            default_prompt.strip() if default_prompt and default_prompt.strip() else DEFAULT_SYSTEM_PROMPT
        )

    @property
    def default_prompt(self) -> str:
        """Returns the default system prompt."""
        return self._default_prompt

    def get_system_prompt(self, custom_prompt: Optional[str] = None) -> str:
        """
        Retrieves the system prompt, returning custom_prompt if provided,
        or the centralized default prompt otherwise.
        """
        if custom_prompt and custom_prompt.strip():
            return custom_prompt.strip()
        return self._default_prompt

    @staticmethod
    def ensure_separate_messages(
        system_prompt: Optional[str],
        user_message: str
    ) -> Dict[str, Any]:
        """
        Validates and packages the system prompt and user message separately.
        Enforces that system instructions are NEVER concatenated into the user's message.
        """
        clean_user_message = user_message.strip() if user_message else ""
        resolved_system_prompt = get_system_prompt(system_prompt)
        return {
            "system_prompt": resolved_system_prompt,
            "user_message": clean_user_message
        }


# Singleton instance
prompt_manager = PromptManager()
