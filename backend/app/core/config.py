from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "FanPulse"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str

    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 5

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    # Spotify API
    SPOTIFY_CLIENT_ID: str = ""
    SPOTIFY_CLIENT_SECRET: str = ""
    SPOTIFY_REDIRECT_URI: str = "http://localhost:3000/connect/spotify/callback"

    # Apple Music API
    APPLE_TEAM_ID: str = ""
    APPLE_KEY_ID: str = ""
    APPLE_PRIVATE_KEY: str = ""  # PEM format private key

    # Instagram API
    INSTAGRAM_CLIENT_ID: str = ""
    INSTAGRAM_CLIENT_SECRET: str = ""
    INSTAGRAM_REDIRECT_URI: str = "http://localhost:3000/connect/instagram/callback"

    # TikTok API
    TIKTOK_CLIENT_KEY: str = ""
    TIKTOK_CLIENT_SECRET: str = ""
    TIKTOK_REDIRECT_URI: str = "http://localhost:3000/connect/tiktok/callback"

    # YouTube API
    YOUTUBE_API_KEY: str = ""
    YOUTUBE_CLIENT_ID: str = ""
    YOUTUBE_CLIENT_SECRET: str = ""
    YOUTUBE_REDIRECT_URI: str = "http://localhost:3000/connect/youtube/callback"

    # Email
    SENDGRID_API_KEY: str = ""
    FROM_EMAIL: str = "noreply@fanpulse.io"

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
