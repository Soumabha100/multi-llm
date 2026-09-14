import asyncio
from typing import List, Optional, Tuple
from openai import AsyncOpenAI
from app.services.base import BaseLLMService
from app.schemas.common import ModelProvider, ChatMessage, ChatRole


from app.services.smart_sim import generate_smart_answer


class OpenAIService(BaseLLMService):
    def __init__(self, model_name: str, api_key: str = "", demo_mode: bool = False):
        super().__init__(provider=ModelProvider.OPENAI, model_name=model_name, api_key=api_key)
        self.demo_mode = demo_mode
        self.client = AsyncOpenAI(api_key=self.api_key) if self.has_api_key else None

    async def generate_response(
        self,
        messages: List[ChatMessage],
        system_prompt: Optional[str] = None
    ) -> Tuple[str, bool]:
        if not self.has_api_key or (self.demo_mode and not self.has_api_key):
            response = await generate_smart_answer("openai", self.model_name, messages)
            return response, True

        # Production Call
        formatted_messages = []
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})

        for msg in messages:
            formatted_messages.append({
                "role": msg.role.value,
                "content": msg.content
            })

        response = await self.client.chat.completions.create(
            model=self.model_name,
            messages=formatted_messages,
            temperature=0.7,
            max_tokens=1500,
        )
        content = response.choices[0].message.content or ""
        return content, False
