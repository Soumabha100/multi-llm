from typing import List, Optional
from pydantic import BaseModel, Field, model_validator
from app.schemas.common import ModelProvider, ChatMessage


class ContinueRequest(BaseModel):
    session_id: str = Field(
        ...,
        min_length=1,
        description="Existing session ID from a previous /chat interaction",
        examples=["550e8400-e29b-41d4-a716-446655440000"]
    )
    selected_model: Optional[ModelProvider] = Field(
        default=None,
        description="The chosen model to continue the conversation with: 'openai', 'claude', or 'gemini'"
    )
    model: Optional[ModelProvider] = Field(
        default=None,
        description="Alias for selected_model"
    )
    user_id: Optional[str] = Field(
        default=None,
        description="Optional user identifier from Firebase or client authentication."
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="Next follow-up message for the chosen model",
        examples=["Can you provide a code example for that?"]
    )

    @model_validator(mode="after")
    def validate_model_selection(self):
        if not self.selected_model and self.model:
            self.selected_model = self.model
        if not self.selected_model:
            raise ValueError("Either 'selected_model' or 'model' must be provided ('openai', 'claude', or 'gemini').")
        return self


class ContinueResponse(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    selected_model: ModelProvider
    model_name: str
    response: str
    latency_ms: float = 0.0
    is_simulated: bool = False
    history: List[ChatMessage] = Field(
        default_factory=list,
        description="Complete conversation history for this specific model"
    )
