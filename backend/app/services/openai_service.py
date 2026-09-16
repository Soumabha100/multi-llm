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
    """
    Formats history and system prompts into OpenAI chat messages structure.
    Supports list of ChatMessage objects, dicts, or tuples.
    """
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
    """
    Clean interface for OpenAI communication using the official OpenAI Python SDK.
    The API key is retrieved dynamically from the OPENAI_API_KEY environment variable.

    Args:
        message: The user's query/message.
        history: Optional conversation history.
        system_prompt: Optional instructions directing tone or persona.
        model: Optional model identifier (defaults to OPENAI_MODEL or gpt-4o-mini).
        api_key: Optional explicit API key (defaults to OPENAI_API_KEY env var).

    Returns:
        Standard result dictionary:
        Success:
            {
                "model": "openai",
                "status": "success",
                "answer": "..."
            }
        Error:
            {
                "model": "openai",
                "status": "error",
                "answer": None,
                "error": "OpenAI request failed"
            }
    """
    # The API key is loaded from the environment and NEVER hardcoded
    resolved_key = (
        api_key or os.getenv("OPENAI_API_KEY") or settings.OPENAI_API_KEY or ""
    ).strip()
    resolved_model = (
        model or os.getenv("OPENAI_MODEL") or settings.OPENAI_MODEL or "gpt-4o-mini"
    )

    if not message or not message.strip():
        return {
            "model": "openai",
            "status": "error",
            "answer": None,
            "error": "OpenAI request failed: message cannot be empty"
        }

    formatted_messages = _format_history_for_openai(
        history=history,
        system_prompt=system_prompt,
        user_message=message.strip()
    )

    # Check for valid API key (non-empty, non-dummy)
    has_valid_key = bool(
        resolved_key and not resolved_key.startswith("your_") and len(resolved_key) > 8
    )

    if not has_valid_key:
        try:
            # Fallback to simulation engine when key is not provided (demo mode)
            sim_messages = [
                ChatMessage(
                    role=ChatRole.USER if m["role"] == "user" else (
                        ChatRole.ASSISTANT if m["role"] == "assistant" else ChatRole.SYSTEM
                    ),
                    content=m["content"]
                )
                for m in formatted_messages
            ]
            answer = await generate_smart_answer("openai", resolved_model, sim_messages)
            return {
                "model": "openai",
                "status": "success",
                "answer": answer
            }
        except Exception as sim_exc:
            return {
                "model": "openai",
                "status": "error",
                "answer": None,
                "error": f"OpenAI request failed: {str(sim_exc)}"
            }

    # Live call to OpenAI using official AsyncOpenAI SDK
    try:
        client = AsyncOpenAI(api_key=resolved_key)
        response = await client.chat.completions.create(
            model=resolved_model,
            messages=formatted_messages,
            temperature=0.7,
            max_tokens=1500,
        )
        answer = response.choices[0].message.content or ""
        return {
            "model": "openai",
            "status": "success",
            "answer": answer
        }
    except OpenAIError as oai_err:
        return {
            "model": "openai",
            "status": "error",
            "answer": None,
            "error": f"OpenAI request failed: {str(oai_err)}"
        }
    except Exception as exc:
        return {
            "model": "openai",
            "status": "error",
            "answer": None,
            "error": f"OpenAI request failed: {str(exc)}"
        }


class OpenAIService(BaseLLMService):
    """
    OpenAI Service adhering to BaseLLMService and orchestrator requirements.
    """

    def __init__(
        self,
        model_name: Optional[str] = None,
        api_key: Optional[str] = None,
        demo_mode: bool = False
    ):
        resolved_key = (
            api_key or os.getenv("OPENAI_API_KEY") or settings.OPENAI_API_KEY or ""
        ).strip()
        resolved_model = (
            model_name or os.getenv("OPENAI_MODEL") or settings.OPENAI_MODEL or "gpt-4o-mini"
        )
        super().__init__(
            provider=ModelProvider.OPENAI,
            model_name=resolved_model,
            api_key=resolved_key
        )
        self.demo_mode = demo_mode
        self.client = AsyncOpenAI(api_key=self.api_key) if self.has_api_key else None

    async def ask(
        self,
        message: str,
        history: Optional[List[Any]] = None,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Convenience method invoking the ask() function with service configuration."""
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
    ) -> Tuple[str, bool]:
        """
        Orchestrator interface compatibility returning (response_text, is_simulated).
        """
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
            api_key=self.api_key
        )

        if result["status"] == "error":
            raise RuntimeError(result.get("error", "OpenAI request failed"))

        is_simulated = not self.has_api_key
        return result.get("answer") or "", is_simulated
