import time
import asyncio
from typing import Dict, Optional, List
from app.config import settings
from app.schemas.common import ModelProvider, ChatMessage
from app.schemas.chat import ModelResponseItem, ChatResponse
from app.schemas.continue_chat import ContinueResponse
from app.models.session_store import session_store
from app.services.openai_service import OpenAIService
from app.services.claude_service import ClaudeService
from app.services.gemini_service import GeminiService


class LLMOrchestrator:
    def __init__(self):
        self.openai_service = OpenAIService(
            model_name=settings.OPENAI_MODEL,
            api_key=settings.OPENAI_API_KEY,
            demo_mode=settings.DEMO_MODE
        )
        self.claude_service = ClaudeService(
            model_name=settings.CLAUDE_MODEL,
            api_key=settings.ANTHROPIC_API_KEY,
            demo_mode=settings.DEMO_MODE
        )
        self.gemini_service = GeminiService(
            model_name=settings.GEMINI_MODEL,
            api_key=settings.GEMINI_API_KEY,
            demo_mode=settings.DEMO_MODE
        )
        self.services = {
            ModelProvider.OPENAI.value: self.openai_service,
            ModelProvider.CLAUDE.value: self.claude_service,
            ModelProvider.GEMINI.value: self.gemini_service,
        }

    async def _call_single_model(
        self,
        provider: str,
        messages: List[ChatMessage],
        system_prompt: Optional[str] = None
    ) -> ModelResponseItem:
        service = self.services.get(provider)
        if not service:
            return ModelResponseItem(
                status="error",
                provider=provider,
                model="unknown",
                error=f"Unsupported provider: {provider}",
                latency_ms=0.0
            )

        start_time = time.perf_counter()
        try:
            response_text, is_simulated = await service.generate_response(
                messages=messages,
                system_prompt=system_prompt
            )
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return ModelResponseItem(
                status="success",
                provider=provider,
                model=service.model_name,
                response=response_text,
                latency_ms=elapsed_ms,
                is_simulated=is_simulated
            )
        except Exception as exc:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return ModelResponseItem(
                status="error",
                provider=provider,
                model=service.model_name,
                error=str(exc),
                latency_ms=elapsed_ms
            )

    async def handle_parallel_chat(
        self,
        message: str,
        session_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        history: Optional[List[ChatMessage]] = None
    ) -> ChatResponse:
        session = session_store.get_or_create(session_id=session_id, system_prompt=system_prompt)
        active_session_id = session.session_id
        eff_system_prompt = system_prompt or session.system_prompt

        if history is not None:
            session_store.hydrate_all_histories(active_session_id, history)

        # Append user message to all models
        session_store.add_user_message_to_all(active_session_id, message)

        # Build parallel tasks for each provider
        providers = [
            ModelProvider.OPENAI.value,
            ModelProvider.CLAUDE.value,
            ModelProvider.GEMINI.value
        ]

        tasks = [
            self._call_single_model(
                provider=p,
                messages=session_store.get_history(active_session_id, p),
                system_prompt=eff_system_prompt
            )
            for p in providers
        ]

        # Concurrent parallel execution with fault isolation
        results = await asyncio.gather(*tasks, return_exceptions=True)

        responses_map: Dict[str, ModelResponseItem] = {}
        for provider, res in zip(providers, results):
            if isinstance(res, Exception):
                service = self.services.get(provider)
                responses_map[provider] = ModelResponseItem(
                    status="error",
                    provider=provider,
                    model=service.model_name if service else "unknown",
                    error=str(res),
                    latency_ms=0.0
                )
            else:
                responses_map[provider] = res
                # Record successful assistant response into session store
                if res.status == "success" and res.response:
                    session_store.add_assistant_response(
                        session_id=active_session_id,
                        provider=provider,
                        model_name=res.model,
                        content=res.response
                    )

        return ChatResponse(
            session_id=active_session_id,
            user_message=message,
            system_prompt=eff_system_prompt,
            responses=responses_map
        )

    async def handle_continue_chat(
        self,
        session_id: str,
        selected_model: ModelProvider,
        message: str,
        history: Optional[List[ChatMessage]] = None
    ) -> ContinueResponse:
        session = session_store.get_session(session_id)
        if not session:
            # Create if not found
            session = session_store.get_or_create(session_id)

        provider_key = selected_model.value
        
        if history is not None:
            session_store.hydrate_provider_history(session_id, provider_key, history)

        session_store.add_user_message_to_provider(session_id, provider_key, message)

        history = session_store.get_history(session_id, provider_key)
        res = await self._call_single_model(
            provider=provider_key,
            messages=history,
            system_prompt=session.system_prompt
        )

        if res.status == "error":
            raise RuntimeError(res.error or "Model invocation failed")

        session_store.add_assistant_response(
            session_id=session_id,
            provider=provider_key,
            model_name=res.model,
            content=res.response or ""
        )

        updated_history = session_store.get_history(session_id, provider_key)
        return ContinueResponse(
            session_id=session_id,
            selected_model=selected_model,
            model_name=res.model,
            response=res.response or "",
            latency_ms=res.latency_ms,
            is_simulated=res.is_simulated,
            history=updated_history
        )


orchestrator = LLMOrchestrator()
