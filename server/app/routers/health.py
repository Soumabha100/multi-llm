from datetime import datetime, timezone
from fastapi import APIRouter
from app.config import settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check & system configuration status"
)
async def health_check():
    configured_models = {
        "openai": settings.OPENAI_MODEL,
        "claude": settings.CLAUDE_MODEL,
        "gemini": settings.GEMINI_MODEL,
    }
    available_providers = ["openai", "claude", "gemini"]

    return HealthResponse(
        status="healthy",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        timestamp=datetime.now(timezone.utc),
        demo_mode=settings.DEMO_MODE,
        configured_models=configured_models,
        available_providers=available_providers,
    )
