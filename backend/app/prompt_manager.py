"""
Prompt Manager Module Re-export

Allows importing prompt_manager directly from app.prompt_manager.
"""

from app.services.prompt_manager import (
    DEFAULT_SYSTEM_PROMPT,
    SYSTEM_PROMPT,
    get_system_prompt,
    PromptManager,
    prompt_manager,
)

__all__ = [
    "DEFAULT_SYSTEM_PROMPT",
    "SYSTEM_PROMPT",
    "get_system_prompt",
    "PromptManager",
    "prompt_manager",
]
