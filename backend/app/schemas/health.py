from datetime import datetime, timezone
from typing import Dict
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "healthy"
    app_name: str
    version: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    demo_mode: bool
    configured_models: Dict[str, str]
    available_providers: list[str]
