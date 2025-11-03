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

# Beat schedule for periodic tasks
from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    # Fetch artist data from platforms every 6 hours
    "fetch-artist-data-periodic": {
        "task": "app.tasks.analytics.fetch_all_artist_data",
        "schedule": 6 * 60 * 60,  # Every 6 hours
    },

    # Refresh expiring OAuth tokens every hour
    "refresh-expiring-tokens": {
        "task": "app.tasks.analytics.refresh_expiring_tokens",
        "schedule": 60 * 60,  # Every hour
    },

    # Send weekly email reports every Monday at 8 AM UTC
    "send-weekly-reports": {
        "task": "app.tasks.email.send_weekly_reports",
        "schedule": crontab(day_of_week=1, hour=8, minute=0),
    },

    # Clean up expired alert notifications daily at 2 AM UTC
    "cleanup-expired-alerts": {
        "task": "app.tasks.analytics.cleanup_expired_alerts",
        "schedule": crontab(hour=2, minute=0),
    },
}
