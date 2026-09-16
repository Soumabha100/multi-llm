"""
Main ASGI application entrypoint for uvicorn.
Allows running: `uvicorn main:app --reload` directly from the backend directory.
"""
from app.main import app

__all__ = ["app"]
