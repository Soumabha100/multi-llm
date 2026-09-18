from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from app.schemas.common import ChatMessage, ModelProvider


class BaseLLMService(ABC):
    """Abstract base class for all LLM provider services."""

    def __init__(self, provider: ModelProvider, model_name: str, api_key: str = ""):
        self.provider = provider
        self.model_name = model_name
        self.api_key = api_key.strip()

    @property
    def has_api_key(self) -> bool:
        # Check for meaningful non-empty, non-dummy key
        return bool(self.api_key and not self.api_key.startswith("your_") and len(self.api_key) > 8)

    @abstractmethod
    async def generate_response(
        self,
        messages: List[ChatMessage],
        system_prompt: Optional[str] = None
    ) -> Tuple[str, bool, str]:
        """
        Generate response from the model.
        Returns:
            Tuple[str, bool, str]: (response_text, is_simulated, actual_model_used)
        """
        pass
