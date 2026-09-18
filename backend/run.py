import uvicorn
from app.config import settings

if __name__ == "__main__":
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} on {settings.HOST}:{settings.PORT} ...")
    print(f"Swagger API Docs: http://localhost:{settings.PORT}/docs")
    print(f"Demo / Simulation Mode: {'ENABLED (No paid API keys needed)' if settings.DEMO_MODE else 'DISABLED (Live LLMs)'}")
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        reload_dirs=["app"] if settings.DEBUG else None
    )
