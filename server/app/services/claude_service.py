import asyncio
from typing import List, Optional, Tuple
from anthropic import AsyncAnthropic
from app.services.base import BaseLLMService
from app.schemas.common import ModelProvider, ChatMessage, ChatRole


from app.services.smart_sim import generate_smart_answer


class ClaudeService(BaseLLMService):
    def __init__(self, model_name: str, api_key: str = "", demo_mode: bool = False):
        super().__init__(provider=ModelProvider.CLAUDE, model_name=model_name, api_key=api_key)
        self.demo_mode = demo_mode
        self.client = AsyncAnthropic(api_key=self.api_key) if self.has_api_key else None

    async def generate_response(
        self,
        messages: List[ChatMessage],
        system_prompt: Optional[str] = None
    ) -> Tuple[str, bool]:
        if not self.has_api_key or (self.demo_mode and not self.has_api_key):
            response = await generate_smart_answer("claude", self.model_name, messages)
            return response, True

        # Anthropic requires alternating user/assistant messages and top-level system parameter
        formatted_messages = []
        for msg in messages:
            if msg.role in (ChatRole.USER, ChatRole.ASSISTANT):
                # Ensure role matches anthropic specification
                role_val = "user" if msg.role == ChatRole.USER else "assistant"
                formatted_messages.append({
                    "role": role_val,
                    "content": msg.content
                })

        # Anthropic requires at least one user message
        if not formatted_messages:
            formatted_messages = [{"role": "user", "content": "Hello"}]

        kwargs = {
            "model": self.model_name,
            "max_tokens": 1500,
            "messages": formatted_messages,
        }
        if system_prompt:
            kwargs["system"] = system_prompt

        response = await self.client.messages.create(**kwargs)
        # Extract text blocks
        content_parts = []
        for block in response.content:
            if hasattr(block, "text"):
                content_parts.append(block.text)
        content = "\n".join(content_parts)
        return content, False
