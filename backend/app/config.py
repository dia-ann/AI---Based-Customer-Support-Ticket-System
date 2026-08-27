from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = ROOT_DIR / ".env"


class Settings(BaseSettings):
    DATABASE_URL: str
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str

    DEBUG: bool = False

    SENTRY_DSN: str | None = None
    SENTRY_ENVIRONMENT: str = "development"
    # 1.0 = trace 100% of requests. Fine locally; drop to ~0.2 if you hit span limits.
    SENTRY_TRACES_SAMPLE_RATE: float = 1.0

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()  # pyright: ignore[reportCallIssue]