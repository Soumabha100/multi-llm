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
    ) -> Tuple[str, bool, str]:
        if not self.has_api_key or (self.demo_mode and not self.has_api_key):
            response = await generate_smart_answer("gemini", self.model_name, messages)
            return response, True, self.model_name

        # Define fallback models explicitly prioritizing the user's primary model
        fallback_models = [self.model_name]
        default_fallbacks = [
            "gemini-flash-latest",
            "gemini-3.8-flash",
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-flash-lite-latest",
            "gemini-3.1-flash-lite",
            "gemma-4-26b-a4b-it"
        ]
        
        # Add default fallbacks that are not the primary model
        for m in default_fallbacks:
            if m not in fallback_models:
                fallback_models.append(m)

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

        last_error = None
        for current_model in fallback_models:
            try:
                response = await self.client.aio.models.generate_content(
                    model=current_model,
                    contents=contents,
                    config=config
                )
                text = (response.text or "").strip()
                if not text:
                    raise RuntimeError(f"Model {current_model} returned an empty response.")
                
                # If we succeeded, return immediately with the model that succeeded
                return text, False, current_model
            except Exception as exc:
                print(f"[GeminiService] Model {current_model} failed: {str(exc)}")
                last_error = exc
                continue

        # If all models failed, raise the final error
        raise RuntimeError(f"Gemini request failed after trying all fallback models. Last error: {str(last_error)}")
