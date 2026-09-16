import os
import re
import asyncio
from typing import Any, Dict, List, Optional, Tuple
from anthropic import AsyncAnthropic, APIError
from app.config import settings
from app.services.base import BaseLLMService
from app.schemas.common import ModelProvider, ChatMessage, ChatRole
from app.services.smart_sim import generate_smart_answer


def _sanitize_error(error_msg: str, api_key: str = "") -> str:
    """Never expose credentials in error messages."""
    sanitized = error_msg
    if api_key and len(api_key) > 4:
        sanitized = sanitized.replace(api_key, "[REDACTED_API_KEY]")
    sanitized = re.sub(r"sk-ant-[a-zA-Z0-9_\-]+", "[REDACTED_API_KEY]", sanitized)
    return sanitized


def _format_and_normalize_claude_messages(
    history: Optional[List[Any]] = None,
    user_message: Optional[str] = None
) -> List[Dict[str, str]]:
    """
    Anthropic requires:
    1. First message must be 'user'
    2. Roles must strictly alternate between 'user' and 'assistant'
    3. System prompt must be passed separately as the top-level 'system' parameter
    """
    raw_list: List[Dict[str, str]] = []

    if history:
        for item in history:
            if isinstance(item, ChatMessage):
                if item.role == ChatRole.SYSTEM:
                    continue
                role_val = "user" if item.role == ChatRole.USER else "assistant"
                content_val = (item.content or "").strip()
                if content_val:
                    raw_list.append({"role": role_val, "content": content_val})
            elif isinstance(item, dict):
                role_val = str(item.get("role", "user")).lower()
                if role_val == "system":
                    continue
                content_val = str(item.get("content", "")).strip()
                if content_val:
                    role_normalized = "user" if role_val == "user" else "assistant"
                    raw_list.append({"role": role_normalized, "content": content_val})
            elif isinstance(item, (list, tuple)) and len(item) == 2:
                role_val = str(item[0]).lower()
                if role_val == "system":
                    continue
                content_val = str(item[1]).strip()
                if content_val:
                    role_normalized = "user" if role_val == "user" else "assistant"
                    raw_list.append({"role": role_normalized, "content": content_val})

    if user_message and user_message.strip():
        raw_list.append({"role": "user", "content": user_message.strip()})

    if not raw_list:
        return [{"role": "user", "content": "Hello"}]

    # Merge consecutive messages with the same role
    merged: List[Dict[str, str]] = []
    for m in raw_list:
        if merged and merged[-1]["role"] == m["role"]:
            merged[-1]["content"] += f"\n\n{m['content']}"
        else:
            merged.append(m)

    # Ensure first message is user
    if merged and merged[0]["role"] != "user":
        merged.insert(0, {"role": "user", "content": "Hello"})

    return merged


def _normalize_anthropic_messages(messages: List[ChatMessage]) -> List[Dict[str, str]]:
    """Alias for message normalization preserving backwards compatibility."""
    return _format_and_normalize_claude_messages(history=messages)


async def ask(
    message: str,
    history: Optional[List[Any]] = None,
    system_prompt: Optional[str] = None,
    model: Optional[str] = None,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Clean interface for Claude communication using official Anthropic Python SDK.
    The API key is retrieved dynamically from the ANTHROPIC_API_KEY environment variable.

    Args:
        message: The user's query/message.
        history: Optional conversation history.
        system_prompt: Optional instructions directing tone or persona (passed separately).
        model: Optional model identifier (defaults to CLAUDE_MODEL or claude-3-5-sonnet-20241022).
        api_key: Optional explicit API key (defaults to ANTHROPIC_API_KEY env var).

    Returns:
        Standard result dictionary:
        Success:
            {
                "model": "claude",
                "status": "success",
                "answer": "..."
            }
        Error:
            {
                "model": "claude",
                "status": "error",
                "answer": None,
                "error": "..."
            }
    """
    resolved_key = (
        api_key or os.getenv("ANTHROPIC_API_KEY") or settings.ANTHROPIC_API_KEY or ""
    ).strip()
    resolved_model = (
        model or os.getenv("CLAUDE_MODEL") or settings.CLAUDE_MODEL or "claude-3-5-sonnet-20241022"
    )

    if not message or not message.strip():
        return {
            "model": "claude",
            "status": "error",
            "answer": None,
            "error": "Claude request failed: message cannot be empty"
        }

    formatted_messages = _format_and_normalize_claude_messages(
        history=history,
        user_message=message
    )

    # Handle missing or dummy API key
    has_valid_key = bool(
        resolved_key and not resolved_key.startswith("your_") and len(resolved_key) > 8
    )

    if not has_valid_key:
        try:
            # Fall back to simulation engine in demo mode
            sim_messages = [
                ChatMessage(
                    role=ChatRole.USER if m["role"] == "user" else ChatRole.ASSISTANT,
                    content=m["content"]
                )
                for m in formatted_messages
            ]
            answer = await generate_smart_answer("claude", resolved_model, sim_messages)
            return {
                "model": "claude",
                "status": "success",
                "answer": answer
            }
        except Exception as sim_exc:
            return {
                "model": "claude",
                "status": "error",
                "answer": None,
                "error": f"Claude simulation failed: {str(sim_exc)}"
            }

    # Live call to Anthropic API using AsyncAnthropic SDK
    try:
        client = AsyncAnthropic(api_key=resolved_key)
        kwargs = {
            "model": resolved_model,
            "max_tokens": 1500,
            "messages": formatted_messages,
        }
        # Anthropic requires system prompt to be passed separately as top-level parameter
        if system_prompt and system_prompt.strip():
            kwargs["system"] = system_prompt.strip()

        response = await client.messages.create(**kwargs)

        # Extract text blocks
        content_parts = []
        for block in response.content:
            if hasattr(block, "text"):
                content_parts.append(block.text)
        answer = "\n".join(content_parts)

        return {
            "model": "claude",
            "status": "success",
            "answer": answer
        }
    except APIError as api_err:
        return {
            "model": "claude",
            "status": "error",
            "answer": None,
            "error": _sanitize_error(f"Claude request failed: {str(api_err)}", resolved_key)
        }
    except Exception as exc:
        return {
            "model": "claude",
            "status": "error",
            "answer": None,
            "error": _sanitize_error(f"Claude request failed: {str(exc)}", resolved_key)
        }


class ClaudeService(BaseLLMService):
    """
    Claude Service adhering to BaseLLMService and orchestrator requirements.
    """

    def __init__(
        self,
        model_name: Optional[str] = None,
        api_key: Optional[str] = None,
        demo_mode: bool = False
    ):
        resolved_key = (
            api_key or os.getenv("ANTHROPIC_API_KEY") or settings.ANTHROPIC_API_KEY or ""
        ).strip()
        resolved_model = (
            model_name or os.getenv("CLAUDE_MODEL") or settings.CLAUDE_MODEL or "claude-3-5-sonnet-20241022"
        )
        super().__init__(
            provider=ModelProvider.CLAUDE,
            model_name=resolved_model,
            api_key=resolved_key
        )
        self.demo_mode = demo_mode
        self.client = AsyncAnthropic(api_key=self.api_key) if self.has_api_key else None

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
            raise RuntimeError(result.get("error", "Claude request failed"))

        is_simulated = not self.has_api_key
        return result.get("answer") or "", is_simulated
