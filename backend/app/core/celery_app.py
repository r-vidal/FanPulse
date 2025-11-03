"""Celery application configuration"""
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "fanpulse",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks"]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
)

# Task routing (optional)
celery_app.conf.task_routes = {
    "app.tasks.email.*": {"queue": "email"},
    "app.tasks.analytics.*": {"queue": "analytics"},
}

# Beat schedule for periodic tasks (optional)
celery_app.conf.beat_schedule = {
    "fetch-artist-data-daily": {
        "task": "app.tasks.analytics.fetch_all_artist_data",
        "schedule": 6 * 60 * 60,  # Every 6 hours
    },
}
