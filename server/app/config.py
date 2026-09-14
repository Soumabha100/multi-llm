from typing import List
# pyrefly: ignore [missing-import]
from pydantic import Field
# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App Information
    APP_NAME: str = "Multi-LLM Custom ChatGPT"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # API Keys for LLM Providers
    OPENAI_API_KEY: str = Field(default="")
    ANTHROPIC_API_KEY: str = Field(default="")
    GEMINI_API_KEY: str = Field(default="")

    # Default LLM Models
    OPENAI_MODEL: str = "gpt-4o-mini"
    CLAUDE_MODEL: str = "claude-3-5-sonnet-20241022"
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # Simulation / Demo Mode switch
    # When True or when a provider key is missing, smart mock responses are generated
    DEMO_MODE: bool = True

    # CORS Settings
    CORS_ORIGINS: str = "*"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS or self.CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
