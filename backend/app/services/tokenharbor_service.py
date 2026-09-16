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
    api_key: Optional[str] = None,
    base_url: Optional[str] = None
) -> Dict[str, Any]:
    resolved_key = (
        api_key or os.getenv("TOKENHARBOR_API_KEY") or settings.TOKENHARBOR_API_KEY or ""
    ).strip()
    resolved_model = (
        model or os.getenv("TOKENHARBOR_MODEL") or settings.TOKENHARBOR_MODEL or "deepseek-v4.1-flash:free"
    )
    resolved_base_url = (
        base_url or os.getenv("TOKENHARBOR_BASE_URL") or getattr(settings, "TOKENHARBOR_BASE_URL", "https://api.tokenharbor.com/v1")
    )

    if not message or not message.strip():
        return {
            "model": "tokenharbor",
            "status": "error",
            "answer": None,
            "error": "Token Harbor request failed: message cannot be empty"
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
            answer = await generate_smart_answer("tokenharbor", resolved_model, sim_messages)
            return {
                "model": "tokenharbor",
                "status": "success",
                "answer": answer
            }
        except Exception as sim_exc:
            return {
                "model": "tokenharbor",
                "status": "error",
                "answer": None,
                "error": f"Token Harbor simulation failed: {str(sim_exc)}"
            }

    try:
        client = AsyncOpenAI(
            api_key=resolved_key,
            base_url=resolved_base_url
        )
        response = await client.chat.completions.create(
            model=resolved_model,
            messages=formatted_messages,
            temperature=0.7,
            max_tokens=1500,
        )
        answer = response.choices[0].message.content or ""
        return {
            "model": "tokenharbor",
            "status": "success",
            "answer": answer
        }
    except OpenAIError as oai_err:
        return {
            "model": "tokenharbor",
            "status": "error",
            "answer": None,
            "error": f"Token Harbor request failed: {str(oai_err)}"
        }
    except Exception as exc:
        return {
            "model": "tokenharbor",
            "status": "error",
            "answer": None,
            "error": f"Token Harbor request failed: {str(exc)}"
        }


class TokenHarborService(BaseLLMService):
    def __init__(
        self,
        model_name: Optional[str] = None,
        api_key: Optional[str] = None,
        demo_mode: bool = False
    ):
        resolved_key = (
            api_key or os.getenv("TOKENHARBOR_API_KEY") or settings.TOKENHARBOR_API_KEY or ""
        ).strip()
        resolved_model = (
            model_name or os.getenv("TOKENHARBOR_MODEL") or settings.TOKENHARBOR_MODEL or "deepseek-v4.1-flash:free"
        )
        super().__init__(
            provider=ModelProvider.TOKENHARBOR,
            model_name=resolved_model,
            api_key=resolved_key
        )
        self.demo_mode = demo_mode
        self.base_url = os.getenv("TOKENHARBOR_BASE_URL") or getattr(settings, "TOKENHARBOR_BASE_URL", "https://api.tokenharbor.com/v1")
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.base_url
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
            api_key=self.api_key,
            base_url=self.base_url
        )

    async def generate_response(
        self,
        messages: List[ChatMessage],
        system_prompt: Optional[str] = None
    ) -> Tuple[str, bool]:
        if not messages:
            return "", False

        last_msg = messages[-1]
        user_query = last_msg.content if last_msg.role == ChatRole.USER else ""
        history_msgs = messages[:-1] if user_query else messages

        result = await ask(
            message=user_query or "Hello",
            history=history_msgs,
            system_prompt=system_prompt,
            model=self.model_name,
            api_key=self.api_key,
            base_url=self.base_url
        )

        if result["status"] == "error":
            raise RuntimeError(result.get("error", "Token Harbor request failed"))

        is_simulated = not self.has_api_key
        return result.get("answer") or "", is_simulated
