import os
import asyncio
from typing import Any, Dict, List, Optional, Tuple
from openai import AsyncOpenAI, OpenAIError
from app.config import settings
from app.services.base import BaseLLMService
from app.schemas.common import ModelProvider, ChatMessage, ChatRole
from app.services.smart_sim import generate_smart_answer

def _format_history_for_openai(
    history: Optional[List[Any]] = None,
    system_prompt: Optional[str] = None,
    user_message: Optional[str] = None
) -> List[Dict[str, str]]:
    formatted: List[Dict[str, str]] = []

    if system_prompt:
        formatted.append({"role": "system", "content": system_prompt})

    if history:
        for item in history:
            if isinstance(item, ChatMessage):
                role = item.role.value if hasattr(item.role, "value") else str(item.role)
                if role == "system" and system_prompt:
                    continue
                formatted.append({"role": role, "content": item.content or ""})
            elif isinstance(item, dict):
                role = str(item.get("role", "user"))
                if role == "system" and system_prompt:
                    continue
                formatted.append({"role": role, "content": str(item.get("content", ""))})
            elif isinstance(item, (list, tuple)) and len(item) == 2:
                formatted.append({"role": str(item[0]), "content": str(item[1])})

    if user_message:
        formatted.append({"role": "user", "content": user_message})

    return formatted

async def ask(
    message: str,
    history: Optional[List[Any]] = None,
    system_prompt: Optional[str] = None,
    model: Optional[str] = None,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    resolved_key = (
        api_key or os.getenv("OPENROUTER_API_KEY") or settings.OPENROUTER_API_KEY or ""
    ).strip()
    resolved_model = (
        model or os.getenv("OPENROUTER_MODEL") or settings.OPENROUTER_MODEL or "nvidia/nemotron-3-ultra-550b-a55b:free"
    )

    if not message or not message.strip():
        return {
            "model": "openrouter",
            "status": "error",
            "answer": None,
            "error": "OpenRouter request failed: message cannot be empty"
        }

    formatted_messages = _format_history_for_openai(
        history=history,
        system_prompt=system_prompt,
        user_message=message.strip()
    )

    has_valid_key = bool(
        resolved_key and not resolved_key.startswith("your_") and len(resolved_key) > 8
    )

    if not has_valid_key:
        try:
            sim_messages = [
                ChatMessage(
                    role=ChatRole.USER if m["role"] == "user" else (
                        ChatRole.ASSISTANT if m["role"] == "assistant" else ChatRole.SYSTEM
                    ),
                    content=m["content"]
                )
                for m in formatted_messages
            ]
            answer = await generate_smart_answer("openrouter", resolved_model, sim_messages)
            return {
                "model": "openrouter",
                "status": "success",
                "answer": answer
            }
        except Exception as sim_exc:
            return {
                "model": "openrouter",
                "status": "error",
                "answer": None,
                "error": f"OpenRouter request failed: {str(sim_exc)}"
            }

    try:
        client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=resolved_key,
        )
        response = await client.chat.completions.create(
            model=resolved_model,
            messages=formatted_messages,
            temperature=0.7,
            max_tokens=1500,
        )
        answer = response.choices[0].message.content or ""
        return {
            "model": "openrouter",
            "status": "success",
            "answer": answer
        }
    except OpenAIError as oai_err:
        return {
            "model": "openrouter",
            "status": "error",
            "answer": None,
            "error": f"OpenRouter request failed: {str(oai_err)}"
        }
    except Exception as exc:
        return {
            "model": "openrouter",
            "status": "error",
            "answer": None,
            "error": f"OpenRouter request failed: {str(exc)}"
        }

class OpenRouterService(BaseLLMService):
    def __init__(
        self,
        model_name: Optional[str] = None,
        api_key: Optional[str] = None,
        demo_mode: bool = False
    ):
        resolved_key = (
            api_key or os.getenv("OPENROUTER_API_KEY") or settings.OPENROUTER_API_KEY or ""
        ).strip()
        resolved_model = (
            model_name or os.getenv("OPENROUTER_MODEL") or settings.OPENROUTER_MODEL or "nvidia/nemotron-3-ultra-550b-a55b:free"
        )
        super().__init__(
            provider=ModelProvider.OPENROUTER,
            model_name=resolved_model,
            api_key=resolved_key
        )
        self.demo_mode = demo_mode
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=self.api_key
        ) if self.has_api_key else None

    async def ask(
        self,
        message: str,
        history: Optional[List[Any]] = None,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        return await ask(
            message=message,
            history=history,
            system_prompt=system_prompt,
            model=self.model_name,
            api_key=self.api_key
        )

    async def generate_response(
        self,
        messages: List[ChatMessage],
        system_prompt: Optional[str] = None
    ) -> Tuple[str, bool, str]:
        if not messages:
            return "", False, self.model_name

        last_msg = messages[-1]
        user_query = last_msg.content if last_msg.role == ChatRole.USER else ""
        history_msgs = messages[:-1] if user_query else messages

        # Define fallback models explicitly prioritizing the user's primary model
        fallback_models = [self.model_name]
        default_fallbacks = [
            "openai/gpt-3.5-turbo",
            "anthropic/claude-3-haiku"
        ]
        
        for m in default_fallbacks:
            if m not in fallback_models:
                fallback_models.append(m)

        last_error_msg = None
        for current_model in fallback_models:
            result = await ask(
                message=user_query or "Hello",
                history=history_msgs,
                system_prompt=system_prompt,
                model=current_model,
                api_key=self.api_key
            )

            if result["status"] == "success":
                is_simulated = not self.has_api_key
                return result.get("answer") or "", is_simulated, current_model
            else:
                last_error_msg = result.get("error", "OpenRouter request failed")
                print(f"[OpenRouterService] Model {current_model} failed: {last_error_msg}")
                continue

        raise RuntimeError(f"OpenRouter request failed after trying all fallback models. Last error: {last_error_msg}")
