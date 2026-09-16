import asyncio
from typing import Optional
from fastapi import APIRouter, HTTPException, Path, Query, status
from app.schemas.continue_chat import ContinueRequest, ContinueResponse
from app.schemas.common import ModelProvider
from app.models.session_store import session_store
from app.services.orchestrator import orchestrator

from app.services.llm_manager import ask_model, SUPPORTED_MODELS
from app.models.conversation_memory import normalize_model_name
from app.services.prompt_manager import get_system_prompt

router = APIRouter(tags=["Continue & History"])


@router.post(
    "/continue",
    response_model=ContinueResponse,
    summary="Continue conversation with a selected LLM",
    description="Maintains dedicated multi-turn context for the chosen model within the session."
)
async def continue_conversation(request: ContinueRequest):
    try:
        model_str = request.selected_model.value if hasattr(request.selected_model, "value") else str(request.selected_model)
        norm_model = normalize_model_name(model_str)

        # Model validation: reject unsupported models immediately without calling any provider
        if norm_model not in SUPPORTED_MODELS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported model: '{model_str}'. Supported models: {', '.join(sorted(SUPPORTED_MODELS))}"
            )

        session = session_store.get_session(request.session_id)
        if not session:
            session = session_store.get_or_create(
                session_id=request.session_id,
                user_id=request.user_id
            )
        elif request.user_id and not session.user_id:
            session.user_id = request.user_id

        user_id = session.user_id or request.user_id or "anonymous_user"
        eff_system_prompt = get_system_prompt(session.system_prompt)

        # Call ask_model specifically for the selected model ONLY (no other providers called)
        try:
            res = await asyncio.wait_for(
                ask_model(
                    norm_model,
                    user_id,
                    request.message,
                    system_prompt=eff_system_prompt,
                    session_id=request.session_id
                ),
                timeout=90.0
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=f"{model_str.capitalize()} request timed out after 90 seconds."
            )

        if res.status == "error":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=res.error or "Model invocation failed"
            )

        updated_history = session_store.get_history(request.session_id, norm_model)
        return ContinueResponse(
            session_id=request.session_id,
            user_id=session.user_id,
            selected_model=request.selected_model,
            model_name=res.model,
            response=res.response or "",
            latency_ms=res.latency_ms,
            is_simulated=res.is_simulated,
            history=updated_history
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Conversation continuation failed: {str(exc)}"
        )


@router.get(
    "/history",
    summary="Retrieve session history (or list active sessions)",
    description=(
        "Enter a `session_id` in the field below to view its conversation history. "
        "If left blank, it returns a list of all active session IDs."
    )
)
async def get_history_query(
    session_id: Optional[str] = Query(
        default=None,
        description="Paste your session_id here to view history. Leave empty to see all active sessions.",
        examples=["81beb646-0f01-41e3-a75d-1353fcbca448"]
    ),
    provider: Optional[ModelProvider] = Query(
        default=None,
        description="Optional filter by provider: 'tokenharbor', 'openrouter', or 'gemini'"
    ),
    user_id: Optional[str] = Query(
        default=None,
        description="Optional filter sessions by user_id"
    )
):
    if not session_id:
        if user_id:
            from app.models.conversation_memory import conversation_memory
            if provider:
                return {
                    "user_id": user_id,
                    "provider": provider.value,
                    "messages": conversation_memory.get_history(user_id, provider.value)
                }
            user_sessions = session_store.get_sessions_by_user(user_id)
            return {
                "user_id": user_id,
                "total_sessions": len(user_sessions),
                "sessions": [
                    {
                        "session_id": s.session_id,
                        "created_at": s.created_at,
                        "last_activity": s.last_activity,
                        "system_prompt": s.system_prompt
                    }
                    for s in user_sessions
                ],
                "memory": conversation_memory.get_user_history(user_id)
            }

        active_ids = session_store.list_active_sessions()
        return {
            "message": "No session_id provided. Here is the list of active sessions.",
            "total_active_sessions": len(active_ids),
            "active_session_ids": active_ids,
            "hint": "Pass ?session_id=<id> or enter it in the session_id box above."
        }

    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found. Available sessions: {session_store.list_active_sessions()}"
        )

    if provider:
        return {
            "session_id": session_id,
            "provider": provider.value,
            "messages": session.histories.get(provider.value, [])
        }

    return {
        "session_id": session_id,
        "histories": session.histories
    }


@router.get(
    "/history/{session_id}",
    summary="Retrieve conversation history by path session_id",
    description="Returns message history for the given session ID."
)
async def get_session_history_path(
    session_id: str = Path(
        ...,
        description="Unique session ID returned from /chat",
        examples=["81beb646-0f01-41e3-a75d-1353fcbca448"]
    ),
    provider: Optional[ModelProvider] = Query(
        default=None,
        description="Optional filter by model provider: 'tokenharbor', 'openrouter', or 'gemini'"
    )
):
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found. Available sessions: {session_store.list_active_sessions()}"
        )

    if provider:
        return {
            "session_id": session_id,
            "provider": provider.value,
            "messages": session.histories.get(provider.value, [])
        }

    return {
        "session_id": session_id,
        "histories": session.histories
    }
