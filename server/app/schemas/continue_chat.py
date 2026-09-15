from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.common import ModelProvider, ChatMessage


class ContinueRequest(BaseModel):
    session_id: str = Field(
        ...,
        min_length=1,
        description="Existing session ID from a previous /chat interaction",
        examples=["550e8400-e29b-41d4-a716-446655440000"]
    )
    selected_model: ModelProvider = Field(
        ...,
        description="The chosen model to continue the conversation with: 'openai', 'claude', or 'gemini'"
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="Next follow-up message for the chosen model",
        examples=["Can you provide a code example for that?"]
    )
    history: Optional[List[ChatMessage]] = Field(
        default=None,
        description="Optional conversation history provided by the client to hydrate state."
    )


class ContinueResponse(BaseModel):
    session_id: str
    selected_model: ModelProvider
    model_name: str
    response: str
    latency_ms: float = 0.0
    is_simulated: bool = False
    history: List[ChatMessage] = Field(
        default_factory=list,
        description="Complete conversation history for this specific model"
    )
