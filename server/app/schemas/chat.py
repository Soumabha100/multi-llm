from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.common import ChatMessage


class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="User query or question to send to all models",
        examples=["Explain quantum computing in simple terms."]
    )
    session_id: Optional[str] = Field(
        default=None,
        description="Unique session or conversation ID. Auto-generated if not supplied."
    )
    system_prompt: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Optional instructions directing the tone or role of all models."
    )
    history: Optional[List[ChatMessage]] = Field(
        default=None,
        description="Optional conversation history provided by the client to hydrate state."
    )


class ModelResponseItem(BaseModel):
    status: str = Field(..., description="'success' or 'error'")
    provider: str = Field(..., description="Provider name: openai, claude, or gemini")
    model: str = Field(..., description="Underlying model identifier used")
    response: Optional[str] = Field(default=None, description="Model generated text response")
    error: Optional[str] = Field(default=None, description="Sanitized error description if failed")
    latency_ms: float = Field(default=0.0, description="Latency of the model call in milliseconds")
    is_simulated: bool = Field(default=False, description="True if simulated response was generated (no API key)")


class ChatResponse(BaseModel):
    session_id: str = Field(..., description="Active session ID for tracking conversation history")
    user_message: str = Field(..., description="The query sent to all models")
    system_prompt: Optional[str] = Field(default=None, description="Active system prompt, if any")
    responses: Dict[str, ModelResponseItem] = Field(
        ...,
        description="Side-by-side responses keyed by provider (openai, claude, gemini)"
    )
