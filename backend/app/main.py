from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.routers import health_router, chat_router, continue_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Production-ready FastAPI backend orchestrating parallel LLM queries "
        "(OpenAI, Anthropic Claude, Google Gemini) with session memory, "
        "smart simulation mode, and fault-tolerant async execution."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(health_router)
app.include_router(chat_router)
app.include_router(continue_router)


@app.get("/", summary="Root status check")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "demo_mode": settings.DEMO_MODE,
        "docs_url": "/docs",
        "endpoints": {
            "health": "/health",
            "chat": "/chat",
            "continue": "/continue",
            "history": "/history/{session_id}"
        }
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": str(exc) if settings.DEBUG else "An unexpected error occurred."
        }
    )
