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
    SENTRY_TRACES_SAMPLE_RATE: float = 1.0

    APP_NAME: str = "Deskwise"
    FRONTEND_URL: str = "http://localhost:5173"

    ALLOW_PUBLIC_SIGNUP: bool = True
    ENFORCE_PASSWORD_CHANGE: bool = True
    MIN_PASSWORD_LENGTH: int = 8

    BREVO_SMTP_HOST: str = "smtp-relay.brevo.com"
    BREVO_SMTP_PORT: int = 587
    BREVO_SMTP_LOGIN: str | None = None
    BREVO_SMTP_KEY: str | None = None
    SMTP_TIMEOUT_SECONDS: int = 20
    MAIL_FROM: str = "no-reply@example.com"
    MAIL_FROM_NAME: str = "Deskwise Support"
    MAIL_REPLY_TO: str | None = None

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()  # pyright: ignore[reportCallIssue]