from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Handwritten Medical Prescription Recognition System"
    environment: str = "development"
    database_url: str = "sqlite+aiosqlite:///./prescriptions.db"
    secret_key: str = "replace-me"
    access_token_expire_minutes: int = 1440
    vision_provider: str = "mock"
    gemini_api_key: str | None = None
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    gemini_model: str = "gemini-1.5-flash"
    ai_fallback_to_mock: bool = True
    medicine_dataset_path: str = "../datasets/medicines.csv"
    interaction_dataset_path: str = "../datasets/drug_interactions.csv"
    allowed_origins: str = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
