import asyncio
from typing import Dict
from fastapi import APIRouter, HTTPException, status
from app.schemas.chat import ChatRequest, ChatResponse, ModelResponseItem
from app.models.session_store import session_store
from app.services.prompt_manager import get_system_prompt
from app.services.llm_manager import ask_model, LLMResponse

router = APIRouter(tags=["Chat"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Send prompt simultaneously to OpenAI, Claude, and Gemini",
    description="Dispatches query concurrently to all 3 LLMs using asyncio.gather. Returns side-by-side responses with fault isolation."
)
async def chat_parallel(request: ChatRequest):
    try:
        session = session_store.get_or_create(
            session_id=request.session_id,
            system_prompt=request.system_prompt,
            user_id=request.user_id
        )
        active_session_id = session.session_id
        user_id = session.user_id or request.user_id or "anonymous_user"
        eff_system_prompt = get_system_prompt(request.system_prompt or session.system_prompt)
        message = request.message

        # Person 2's backend parallel orchestration calling Person 3's ask_model()
        results = await asyncio.gather(
            ask_model("openai", user_id, message, system_prompt=eff_system_prompt, session_id=active_session_id),
            ask_model("claude", user_id, message, system_prompt=eff_system_prompt, session_id=active_session_id),
            ask_model("gemini", user_id, message, system_prompt=eff_system_prompt, session_id=active_session_id),
            return_exceptions=True
        )

        providers = ["openai", "claude", "gemini"]
        responses_map: Dict[str, ModelResponseItem] = {}

        for provider, res in zip(providers, results):
            if isinstance(res, Exception):
                responses_map[provider] = ModelResponseItem(
                    status="error",
                    provider=provider,
                    model="unknown",
                    error=str(res),
                    latency_ms=0.0
                )
            elif isinstance(res, LLMResponse):
                responses_map[provider] = res.to_model_response_item()
            elif isinstance(res, dict):
                responses_map[provider] = ModelResponseItem(
                    status=res.get("status", "error"),
                    provider=provider,
                    model=res.get("model", provider),
                    response=res.get("response") or res.get("answer"),
                    latency_ms=res.get("latency_ms", 0.0),
                    error=res.get("error"),
                    is_simulated=res.get("is_simulated", False)
                )

        return ChatResponse(
            session_id=active_session_id,
            user_id=session.user_id,
            user_message=message,
            system_prompt=eff_system_prompt,
            responses=responses_map
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat orchestration error: {str(exc)}"
        )
