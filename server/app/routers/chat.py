from fastapi import APIRouter, HTTPException, status
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.orchestrator import orchestrator

router = APIRouter(tags=["Chat"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Send prompt simultaneously to OpenAI, Claude, and Gemini",
    description="Dispatches query concurrently to all 3 LLMs using asyncio.gather. Returns side-by-side responses with fault isolation."
)
async def chat_parallel(request: ChatRequest):
    try:
        response = await orchestrator.handle_parallel_chat(
            message=request.message,
            session_id=request.session_id,
            system_prompt=request.system_prompt
        )
        return response
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat orchestration error: {str(exc)}"
        )
