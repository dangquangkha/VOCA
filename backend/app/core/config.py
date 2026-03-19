from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # SePay
    SEPAY_API_TOKEN: str = "placeholder_token"
    SEPAY_ACCOUNT_NUMBER: str = "placeholder_account"
    SEPAY_BANK_CODE: str = "MB" # Example default

    # Email
    EMAILS_ENABLED: bool = True
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "apikey" # Or your email
    SMTP_PASSWORD: str = "password"
    EMAILS_FROM_EMAIL: str = "info@careerpathai.com"
    EMAILS_FROM_NAME: str = "CareerPath AI"

    class Config:
        env_file = "backend/.env"

settings = Settings()