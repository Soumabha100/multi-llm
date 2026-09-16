"""
LLM Manager Module (Root)

Allows importing directly via `import llm_manager` or
`from llm_manager import ask_model, llm_manager`.
"""

try:
    from app.services.llm_manager import (
        SUPPORTED_MODELS,
        LLMManager,
        llm_manager,
        ask_model,
        LLMResponse,
    )
except ImportError:
    # Standalone execution
    from app.schemas.common import ModelProvider
    from app.services.llm_manager import (
        SUPPORTED_MODELS,
        LLMManager,
        llm_manager,
        ask_model,
        LLMResponse,
    )

__all__ = [
    "SUPPORTED_MODELS",
    "LLMManager",
    "llm_manager",
    "ask_model",
    "LLMResponse",
]

