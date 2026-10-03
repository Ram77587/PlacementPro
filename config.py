import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "PlacementPro API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Placement Management System API with Role-Based Access Control and Groq AI ATS Compatibility Scoring."
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Database Configuration (Defaults to PostgreSQL, can use SQLite for local standalone development)
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/placementpro"

    # JWT Authentication Security Settings
    SECRET_KEY: str = "placementpro_super_secret_jwt_key_2026_change_in_production_xyz123"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 Hours

    # Groq API Configuration for ATS Compatibility Evaluation
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
