"""Celery tasks"""
from app.tasks.email import send_email_task
from app.tasks.analytics import fetch_artist_data

__all__ = ["send_email_task", "fetch_artist_data"]
