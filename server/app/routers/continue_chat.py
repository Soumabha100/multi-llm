from typing import Optional
from fastapi import APIRouter, HTTPException, Path, Query, status
from app.schemas.continue_chat import ContinueRequest, ContinueResponse
from app.schemas.common import ModelProvider
from app.models.session_store import session_store
from app.services.orchestrator import orchestrator

router = APIRouter(tags=["Continue & History"])


@router.post(
    "/continue",
    response_model=ContinueResponse,
    summary="Continue conversation with a selected LLM",
    description="Maintains dedicated multi-turn context for the chosen model within the session."
)
async def continue_conversation(request: ContinueRequest):
    try:
        response = await orchestrator.handle_continue_chat(
            session_id=request.session_id,
            selected_model=request.selected_model,
            message=request.message
        )
        return response
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
        description="Optional filter by provider: 'openai', 'claude', or 'gemini'"
    )
):
    if not session_id:
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
        description="Optional filter by model provider: 'openai', 'claude', or 'gemini'"
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
