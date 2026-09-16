"""
LLM Manager Module

Serves as the main centralized interface between the FastAPI backend routers
and the concrete LLM implementations (OpenAI, Claude, Gemini).

Encapsulates all provider-specific calling conventions, conversation memory,
and system prompt handling so that API routers only interact with ask_model().
"""

import time
import asyncio
from typing import Dict, Optional, List, Union, Any, Tuple

from app.config import settings
from app.schemas.common import ModelProvider, ChatMessage, ChatRole
from app.schemas.chat import ModelResponseItem, ChatResponse
from app.schemas.continue_chat import ContinueResponse
from app.models.session_store import session_store
from app.models.conversation_memory import conversation_memory, normalize_model_name
from app.services.prompt_manager import get_system_prompt
from app.services.tokenharbor_service import TokenHarborService
from app.services.openrouter_service import OpenRouterService
from app.services.gemini_service import GeminiService

import re

SUPPORTED_MODELS = {
    "tokenharbor",
    "openrouter",
    "gemini"
}


def classify_and_sanitize_error(exc: Exception, provider: str, model_name: str = "") -> str:
    """
    Classifies raw provider exceptions into clean, secure error messages.
    Guarantees that:
    1. No API keys or secrets are leaked.
    2. No raw Python stack traces are exposed.
    3. Handles:
       - missing API key
       - invalid API key
       - rate limit
       - timeout
       - provider unavailable
       - network error
       - invalid model
       - empty response
    """
    err_str = str(exc)
    exc_type = type(exc).__name__.lower()
    err_lower = err_str.lower()

    # Redact common key formats
    sanitized = re.sub(r"sk-ant-[a-zA-Z0-9_\-]{20,}", "[REDACTED_KEY]", err_str)
    sanitized = re.sub(r"sk-[a-zA-Z0-9_\-]{20,}", "[REDACTED_KEY]", sanitized)
    sanitized = re.sub(r"AIza[a-zA-Z0-9_\-]{25,}", "[REDACTED_KEY]", sanitized)

    # 1. Missing API key
    if ("missing" in err_lower and "key" in err_lower) or ("no api key" in err_lower):
        return f"{provider.capitalize()} API key is missing or not configured."

    # 2. Invalid API key / Authentication
    if any(k in err_lower or k in exc_type for k in ["authentication", "invalid api key", "unauthorized", "401", "api_key_invalid", "permissiondenied"]):
        return f"Authentication failed: Invalid or expired API key for {provider}."

    # 3. Rate limit
    if any(k in err_lower or k in exc_type for k in ["ratelimit", "rate_limit", "429", "quota", "resource_exhausted", "too many requests"]):
        return f"Rate limit exceeded for {provider}. Please try again shortly."

    # 4. Timeout
    if any(k in err_lower or k in exc_type for k in ["timeout", "timed out", "deadline", "timedout"]):
        return f"Request timed out while contacting {provider}."

    # 5. Provider unavailable / Server error
    if any(k in err_lower or k in exc_type for k in ["503", "502", "500", "unavailable", "server_error", "bad gateway", "service unavailable"]):
        return f"{provider.capitalize()} service is temporarily unavailable. Please retry later."

    # 6. Network error
    if any(k in err_lower or k in exc_type for k in ["connection", "network", "connecterror", "econnrefused", "name resolution", "connection error"]):
        return f"Network connection error while contacting {provider}."

    # 7. Invalid model
    if any(k in err_lower or k in exc_type for k in ["not_found", "404", "model_not_found", "does not exist", "unsupported model", "invalid model"]):
        return f"Model '{model_name or provider}' is invalid or unsupported."

    # 8. Empty response
    if any(k in err_lower for k in ["empty response", "blank response", "empty content"]):
        return f"{provider.capitalize()} returned an empty response."

    # Fallback clean sanitized single-line message (no stack traces)
    clean_line = sanitized.split("\n")[0].strip()
    return f"{provider.capitalize()} error: {clean_line}"


class LLMResponse(dict):
    """
    Response object inheriting from dict for full backwards-compatibility.
    Supports attribute access, key access, and string representation.
    """

    def __init__(
        self,
        status: str,
        provider: str,
        model: str,
        response: Optional[str] = None,
        latency_ms: float = 0.0,
        error: Optional[str] = None,
        is_simulated: bool = False,
        **kwargs
    ):
        text_content = response or ""
        super().__init__(
            status=status,
            provider=provider,
            model=model,
            response=text_content,
            answer=text_content,  # convenience alias
            latency_ms=latency_ms,
            error=error,
            is_simulated=is_simulated,
            **kwargs
        )

    def __getattr__(self, name: str) -> Any:
        try:
            return self[name]
        except KeyError:
            raise AttributeError(f"'LLMResponse' object has no attribute '{name}'")

    def __str__(self) -> str:
        return str(self.get("response") or self.get("answer") or "")

    def to_model_response_item(self) -> ModelResponseItem:
        return ModelResponseItem(
            status=self["status"],
            provider=self["provider"],
            model=self["model"],
            response=self["response"],
            latency_ms=self["latency_ms"],
            error=self["error"],
            is_simulated=self["is_simulated"]
        )


class LLMManager:
    """
    Centralized LLM Manager orchestrating calls to OpenAI, Claude, and Gemini.
    """

    def __init__(self):
        self.tokenharbor_service = TokenHarborService(
            model_name=settings.TOKENHARBOR_MODEL,
            api_key=settings.TOKENHARBOR_API_KEY,
            demo_mode=settings.DEMO_MODE
        )
        self.openrouter_service = OpenRouterService(
            model_name=settings.OPENROUTER_MODEL,
            api_key=settings.OPENROUTER_API_KEY,
            demo_mode=settings.DEMO_MODE
        )
        self.gemini_service = GeminiService(
            model_name=settings.GEMINI_MODEL,
            api_key=settings.GEMINI_API_KEY,
            demo_mode=settings.DEMO_MODE
        )
        self.services = {
            "tokenharbor": self.tokenharbor_service,
            "openrouter": self.openrouter_service,
            "gemini": self.gemini_service,
        }

    async def ask_model(
        self,
        model: Union[str, ModelProvider],
        user_id: Optional[str],
        message: str,
        system_prompt: Optional[str] = None,
        session_id: Optional[str] = None,
        **kwargs
    ) -> LLMResponse:
        """
        Main interface to query a specific LLM (tokenharbor, openrouter, or gemini).

        Logic:
            ask_model("tokenharbor", ...)  → Token Harbor service
            ask_model("openrouter", ...)  → OpenRouter service
            ask_model("gemini", ...)  → Gemini service

        Args:
            model (Union[str, ModelProvider]): 'tokenharbor', 'openrouter', or 'gemini'.
            user_id (Optional[str]): Identifier for the active user.
            message (str): The user query.
            system_prompt (Optional[str]): Optional custom system prompt.
            session_id (Optional[str]): Optional session identifier.

        Returns:
            LLMResponse: Response dictionary with provider, model, response, and status.
        """
        provider_key = normalize_model_name(model)

        if provider_key not in SUPPORTED_MODELS:
            return LLMResponse(
                status="error",
                provider=str(model),
                model="unknown",
                response="",
                error=f"Unsupported model: '{model}'. Supported models are: {', '.join(sorted(SUPPORTED_MODELS))}.",
                latency_ms=0.0
            )

        service = self.services.get(provider_key)

        active_user_id = user_id or "anonymous_user"
        eff_system_prompt = get_system_prompt(system_prompt)

        # Retrieve isolated conversation history for this specific (user_id, model)
        existing_history = conversation_memory.get_history(active_user_id, provider_key)

        # Build messages payload for service: prior history + new user message
        new_user_msg = ChatMessage(
            role=ChatRole.USER,
            content=message,
            provider=ModelProvider(provider_key) if provider_key in ["tokenharbor", "openrouter", "gemini"] else None
        )
        messages_to_send = list(existing_history) + [new_user_msg]

        start_time = time.perf_counter()
        try:
            response_text, is_simulated = await service.generate_response(
                messages=messages_to_send,
                system_prompt=eff_system_prompt
            )
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

            # If session_id provided, sync with session_store (which records to conversation_memory)
            if session_id:
                session = session_store.get_session(session_id)
                if session:
                    session_store.add_user_message_to_provider(session_id, provider_key, message)
                    session_store.add_assistant_response(
                        session_id=session_id,
                        provider=provider_key,
                        model_name=service.model_name,
                        content=response_text
                    )
            else:
                # Standalone call without session: record directly in conversation_memory
                conversation_memory.add_user_message(active_user_id, provider_key, message)
                conversation_memory.add_assistant_message(
                    user_id=active_user_id,
                    model=provider_key,
                    response=response_text,
                    model_name=service.model_name
                )

            return LLMResponse(
                status="success",
                provider=provider_key,
                model=service.model_name,
                response=response_text,
                latency_ms=elapsed_ms,
                is_simulated=is_simulated
            )
        except Exception as exc:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            sanitized_err = classify_and_sanitize_error(exc, provider_key, service.model_name)
            return LLMResponse(
                status="error",
                provider=provider_key,
                model=service.model_name,
                response="",
                error=sanitized_err,
                latency_ms=elapsed_ms
            )

    async def handle_chat(
        self,
        message: str,
        session_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> ChatResponse:
        """
        Handles parallel dispatch to all 3 models (OpenAI, Claude, Gemini)
        for the /chat endpoint via ask_model().
        """
        session = session_store.get_or_create(
            session_id=session_id,
            system_prompt=system_prompt,
            user_id=user_id
        )
        active_session_id = session.session_id
        active_user_id = session.user_id or user_id or "anonymous_user"
        eff_system_prompt = get_system_prompt(system_prompt or session.system_prompt)

        providers = ["tokenharbor", "openrouter", "gemini"]

        # Concurrently dispatch via ask_model for each model
        tasks = [
            asyncio.wait_for(
                self.ask_model(
                    model=p,
                    user_id=active_user_id,
                    message=message,
                    system_prompt=eff_system_prompt,
                    session_id=active_session_id
                ),
                timeout=15.0
            )
            for p in providers
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        responses_map: Dict[str, ModelResponseItem] = {}
        for provider, res in zip(providers, results):
            if isinstance(res, Exception):
                service = self.services.get(provider)
                
                err_msg = str(res)
                if isinstance(res, asyncio.TimeoutError):
                    err_msg = f"{provider.capitalize()} timed out after 15 seconds."
                elif not err_msg:
                    err_msg = f"Unknown error occurred with {provider}."
                    
                responses_map[provider] = ModelResponseItem(
                    status="error",
                    provider=provider,
                    model=service.model_name if service else "unknown",
                    error=err_msg,
                    latency_ms=15000.0 if isinstance(res, asyncio.TimeoutError) else 0.0
                )
            elif isinstance(res, LLMResponse):
                responses_map[provider] = res.to_model_response_item()
            elif isinstance(res, ModelResponseItem):
                responses_map[provider] = res
            else:
                responses_map[provider] = ModelResponseItem(
                    status="success" if res.get("status") == "success" else "error",
                    provider=provider,
                    model=res.get("model", "unknown"),
                    response=res.get("response") or res.get("answer"),
                    latency_ms=res.get("latency_ms", 0.0),
                    error=res.get("error")
                )

        return ChatResponse(
            session_id=active_session_id,
            user_id=session.user_id,
            user_message=message,
            system_prompt=eff_system_prompt,
            responses=responses_map
        )


# Singleton LLMManager instance
llm_manager = LLMManager()


# Primary ask_model interface function required by specification
async def ask_model(
    model: Union[str, ModelProvider],
    user_id: Optional[str],
    message: str,
    system_prompt: Optional[str] = None,
    session_id: Optional[str] = None,
    **kwargs
) -> LLMResponse:
    """
    Main interface between FastAPI backend and LLM provider implementations.

    Supported models:
        - tokenharbor
        - openrouter
        - gemini

    Logic:
        ask_model("tokenharbor", ...)  → Token Harbor service
        ask_model("openrouter", ...)  → OpenRouter service
        ask_model("gemini", ...)  → Gemini service
    """
    return await llm_manager.ask_model(
        model=model,
        user_id=user_id,
        message=message,
        system_prompt=system_prompt,
        session_id=session_id,
        **kwargs
    )


__all__ = [
    "SUPPORTED_MODELS",
    "LLMManager",
    "llm_manager",
    "ask_model",
    "LLMResponse",
    "classify_and_sanitize_error",
]
