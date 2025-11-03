"""Celery tasks"""
# Import all tasks so they are registered with Celery
from app.tasks.email import send_email_task
from app.tasks.analytics import fetch_artist_data
from app.tasks.realtime_alerts import (
    scan_opportunities_task,
    send_heartbeat_task,
    cleanup_old_alerts_task
)
from app.tasks.api_keys import (
    calculate_daily_summaries_task,
    cleanup_old_logs_task,
    mark_expired_keys_task,
    send_usage_alerts_task
)
from app.tasks.reports import (
    generate_scheduled_reports_task,
    cleanup_old_reports_task
)
from app.tasks.releases import (
    calculate_release_scores_task,
    scrape_competing_releases_task
)
from app.tasks.revenue import (
    calculate_revenue_forecasts_task,
    cleanup_old_forecasts_task
)

__all__ = [
    "send_email_task",
    "fetch_artist_data",
    "scan_opportunities_task",
    "send_heartbeat_task",
    "cleanup_old_alerts_task",
    "calculate_daily_summaries_task",
    "cleanup_old_logs_task",
    "mark_expired_keys_task",
    "send_usage_alerts_task",
    "generate_scheduled_reports_task",
    "cleanup_old_reports_task",
    "calculate_release_scores_task",
    "scrape_competing_releases_task",
    "calculate_revenue_forecasts_task",
    "cleanup_old_forecasts_task",
]

