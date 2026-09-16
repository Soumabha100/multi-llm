import asyncio
from typing import List, Optional, Tuple
from google import genai
from google.genai import types
from app.services.base import BaseLLMService
from app.schemas.common import ModelProvider, ChatMessage, ChatRole


from app.services.smart_sim import generate_smart_answer


class GeminiService(BaseLLMService):
    def __init__(self, model_name: str, api_key: str = "", demo_mode: bool = False):
        super().__init__(provider=ModelProvider.GEMINI, model_name=model_name, api_key=api_key)
        self.demo_mode = demo_mode
        self.client = genai.Client(api_key=self.api_key) if self.has_api_key else None

    async def generate_response(
        self,
        messages: List[ChatMessage],
        system_prompt: Optional[str] = None
    ) -> Tuple[str, bool]:
        if not self.has_api_key or (self.demo_mode and not self.has_api_key):
            response = await generate_smart_answer("gemini", self.model_name, messages)
            return response, True

        # Build contents using Google GenAI types
        contents = []
        for msg in messages:
            if msg.role == ChatRole.SYSTEM:
                # System prompt is passed separately via GenerateContentConfig
                continue
            role = "user" if msg.role == ChatRole.USER else "model"
            text_val = (msg.content or "").strip()
            if text_val:
                contents.append(
                    types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=text_val)]
                    )
                )

        if not contents:
            contents = [types.Content(role="user", parts=[types.Part.from_text(text="Hello")])]

        config = None
        if system_prompt:
            config = types.GenerateContentConfig(system_instruction=system_prompt)

        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=config
            )
            text = (response.text or "").strip()
            if not text:
                raise RuntimeError("Gemini returned an empty response.")
            return text, False
        except Exception as exc:
            raise RuntimeError(f"Gemini request failed: {str(exc)}")
