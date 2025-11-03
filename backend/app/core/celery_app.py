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

    # Calculate release scores every Monday at 6 AM UTC
    "calculate-release-scores": {
        "task": "app.tasks.releases.calculate_release_scores",
        "schedule": crontab(day_of_week=1, hour=6, minute=0),
    },

    # Scrape competing releases daily at 3 AM UTC
    "scrape-competing-releases": {
        "task": "app.tasks.releases.scrape_competing_releases",
        "schedule": crontab(hour=3, minute=0),
    },

    # Calculate revenue forecasts monthly on 1st at 5 AM UTC
    "calculate-revenue-forecasts": {
        "task": "app.tasks.revenue.calculate_revenue_forecasts",
        "schedule": crontab(day_of_month=1, hour=5, minute=0),
    },

    # Clean up old revenue forecasts monthly on 1st at 4 AM UTC
    "cleanup-old-forecasts": {
        "task": "app.tasks.revenue.cleanup_old_forecasts",
        "schedule": crontab(day_of_month=1, hour=4, minute=0),
    },

    # Calculate daily API key usage summaries at 1 AM UTC
    "calculate-api-key-summaries": {
        "task": "app.tasks.api_keys.calculate_daily_summaries",
        "schedule": crontab(hour=1, minute=0),
    },

    # Clean up old API key logs daily at 2 AM UTC
    "cleanup-old-api-key-logs": {
        "task": "app.tasks.api_keys.cleanup_old_logs",
        "schedule": crontab(hour=2, minute=30),
    },

    # Mark expired API keys every hour
    "mark-expired-api-keys": {
        "task": "app.tasks.api_keys.mark_expired_keys",
        "schedule": 60 * 60,  # Every hour
    },

    # Send usage alerts every 15 minutes
    "send-api-key-usage-alerts": {
        "task": "app.tasks.api_keys.send_usage_alerts",
        "schedule": 15 * 60,  # Every 15 minutes
    },

    # Generate scheduled reports daily at 8 AM UTC
    "generate-scheduled-reports": {
        "task": "app.tasks.reports.generate_scheduled_reports",
        "schedule": crontab(hour=8, minute=0),
    },

    # Clean up old reports weekly on Sunday at 3 AM UTC
    "cleanup-old-reports": {
        "task": "app.tasks.reports.cleanup_old_reports",
        "schedule": crontab(day_of_week=0, hour=3, minute=0),
    },
}
