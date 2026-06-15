from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Supabase config
    SUPABASE_URL: str = "https://jjbicqwwnwtjnhucessm.supabase.co"
    SUPABASE_ANON_KEY: str = "placeholder"
    SUPABASE_SERVICE_ROLE_KEY: str = "placeholder"
    SUPABASE_JWT_SECRET: str | None = None
    
    # SePay
    SEPAY_API_TOKEN: str = "placeholder_token"
    SEPAY_ACCOUNT_NUMBER: str = "placeholder_account"
    SEPAY_BANK_CODE: str = "MB"  # Example default
    # UPDATE (SEC-01): Shared secret for webhook Bearer token verification.
    # Set this in .env to enable HMAC check. If None, check is SKIPPED (dev mode only).
    SEPAY_WEBHOOK_TOKEN: str | None = None

    # Redis — used by ARQ background worker
    REDIS_URL: str = "redis://localhost:6379"

    # Email
    EMAILS_ENABLED: bool = True
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "apikey" # Or your email
    SMTP_PASSWORD: str = "password"
    EMAILS_FROM_EMAIL: str = "info@careerpathai.com"
    EMAILS_FROM_NAME: str = "CareerPath AI"
    RESEND_KEY: str | None = None

    GOOGLE_CLIENT_ID: str | None = None
    ALLOW_MOCK_LOGIN: bool = False  # Set to True ONLY in local dev (.env), never in production

    # Telegram
    TELEGRAM_BOT_TOKEN: str | None = None
    TELEGRAM_ADMIN_CHAT_ID: str | None = None

    class Config:
        import os
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")

settings = Settings()
