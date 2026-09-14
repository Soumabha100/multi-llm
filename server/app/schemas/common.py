from enum import Enum
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


class ModelProvider(str, Enum):
    OPENAI = "openai"
    CLAUDE = "claude"
    GEMINI = "gemini"


class ChatRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class ChatMessage(BaseModel):
    role: ChatRole
    content: str
    provider: Optional[ModelProvider] = None
    model_name: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
