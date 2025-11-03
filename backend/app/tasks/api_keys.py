"""API Keys background tasks"""
import logging
from datetime import datetime, timedelta
from sqlalchemy import func
from app.core.celery_app import celery_app
from app.core.database import get_db_sync
from app.models.api_key import APIKey, APIKeyStatus, APIKeyUsageLog, APIKeyUsageSummary
from app.services.api_key_manager import api_key_manager

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.api_keys.calculate_daily_summaries")
def calculate_daily_summaries_task() -> dict:
    """
    Calculate daily usage summaries for all API keys

    Runs daily at 1 AM UTC to aggregate previous day's usage.
    Pre-computes statistics for fast dashboard loading.

    Returns:
        Summary of calculations
    """
    try:
        logger.info("Starting daily API key usage summary calculation")

        db = next(get_db_sync())

        # Get yesterday's date range
        yesterday = datetime.utcnow().date() - timedelta(days=1)
        start_time = datetime.combine(yesterday, datetime.min.time())
        end_time = datetime.combine(yesterday, datetime.max.time())

        # Get all API keys that were used yesterday
        used_keys = db.query(APIKey).join(APIKeyUsageLog).filter(
            APIKeyUsageLog.timestamp >= start_time,
            APIKeyUsageLog.timestamp <= end_time,
        ).distinct().all()

        if not used_keys:
            logger.info("No API keys used yesterday")
            return {
                "status": "success",
                "summaries_created": 0,
                "message": "No usage to summarize",
            }

        summaries_created = 0

        for api_key in used_keys:
            try:
                # Check if summary already exists
                existing = db.query(APIKeyUsageSummary).filter(
                    APIKeyUsageSummary.api_key_id == api_key.id,
                    APIKeyUsageSummary.date == start_time,
                ).first()

                if existing:
                    logger.debug(f"Summary already exists for key {api_key.id} on {yesterday}")
                    continue

                # Calculate statistics
                logs = db.query(APIKeyUsageLog).filter(
                    APIKeyUsageLog.api_key_id == api_key.id,
                    APIKeyUsageLog.timestamp >= start_time,
                    APIKeyUsageLog.timestamp <= end_time,
                ).all()

                if not logs:
                    continue

                total_requests = len(logs)
                successful_requests = sum(1 for log in logs if 200 <= log.status_code < 300)
                failed_requests = sum(1 for log in logs if log.status_code >= 400)
                rate_limited_requests = sum(1 for log in logs if log.status_code == 429)

                # Calculate response time percentiles
                response_times = sorted([log.response_time_ms for log in logs if log.response_time_ms])
                avg_response_time = int(sum(response_times) / len(response_times)) if response_times else 0
                p95_index = int(len(response_times) * 0.95)
                p95_response_time = response_times[p95_index] if response_times else 0

                # Get top endpoints
                endpoint_counts = {}
                for log in logs:
                    endpoint_counts[log.endpoint] = endpoint_counts.get(log.endpoint, 0) + 1

                top_endpoints = [
                    {"endpoint": endpoint, "count": count}
                    for endpoint, count in sorted(endpoint_counts.items(), key=lambda x: x[1], reverse=True)[:5]
                ]

                # Calculate total compute units
                total_compute_units = sum(log.compute_units for log in logs)

                # Create summary
                summary = APIKeyUsageSummary(
                    api_key_id=api_key.id,
                    user_id=api_key.user_id,
                    date=start_time,
                    total_requests=total_requests,
                    successful_requests=successful_requests,
                    failed_requests=failed_requests,
                    rate_limited_requests=rate_limited_requests,
                    avg_response_time_ms=avg_response_time,
                    p95_response_time_ms=p95_response_time,
                    top_endpoints=top_endpoints,
                    total_compute_units=total_compute_units,
                )

                db.add(summary)
                summaries_created += 1

            except Exception as e:
                logger.error(f"Failed to create summary for API key {api_key.id}: {e}")
                db.rollback()
                continue

        db.commit()

        logger.info(f"Created {summaries_created} daily usage summaries for {yesterday}")

        return {
            "status": "success",
            "date": str(yesterday),
            "summaries_created": summaries_created,
        }

    except Exception as e:
        logger.error(f"Error calculating daily summaries: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


@celery_app.task(name="app.tasks.api_keys.cleanup_old_logs")
def cleanup_old_logs_task() -> dict:
    """
    Delete old API key usage logs

    Runs daily at 2 AM UTC to delete logs older than 30 days.
    Keeps database size manageable while preserving daily summaries.

    Returns:
        Summary of cleanup
    """
    try:
        logger.info("Starting cleanup of old API key usage logs")

        db = next(get_db_sync())

        # Delete logs older than 30 days
        deleted_count = api_key_manager.cleanup_old_logs(db, days=30)

        logger.info(f"Cleaned up {deleted_count} old API key usage logs")

        return {
            "status": "success",
            "logs_deleted": deleted_count,
        }

    except Exception as e:
        logger.error(f"Error cleaning up old logs: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


@celery_app.task(name="app.tasks.api_keys.mark_expired_keys")
def mark_expired_keys_task() -> dict:
    """
    Mark expired API keys as expired

    Runs hourly to update status of keys that have passed their expiration date.

    Returns:
        Summary of updates
    """
    try:
        logger.info("Checking for expired API keys")

        db = next(get_db_sync())

        now = datetime.utcnow()

        # Find active keys that have expired
        expired_keys = db.query(APIKey).filter(
            APIKey.status == APIKeyStatus.ACTIVE,
            APIKey.expires_at.isnot(None),
            APIKey.expires_at < now,
        ).all()

        if not expired_keys:
            logger.info("No expired API keys found")
            return {
                "status": "success",
                "keys_expired": 0,
            }

        # Mark as expired
        for key in expired_keys:
            key.status = APIKeyStatus.EXPIRED
            logger.info(f"Marked API key '{key.name}' ({key.id}) as expired")

        db.commit()

        logger.info(f"Marked {len(expired_keys)} API keys as expired")

        return {
            "status": "success",
            "keys_expired": len(expired_keys),
        }

    except Exception as e:
        logger.error(f"Error marking expired keys: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


@celery_app.task(name="app.tasks.api_keys.send_usage_alerts")
def send_usage_alerts_task() -> dict:
    """
    Send alerts for API keys approaching rate limits

    Runs every 15 minutes to notify users when they're at 80% or 90%
    of their hourly rate limit.

    Returns:
        Summary of alerts sent
    """
    try:
        logger.info("Checking for API keys approaching rate limits")

        db = next(get_db_sync())

        # Find keys at 80% or 90% of their rate limit
        keys_at_80 = db.query(APIKey).filter(
            APIKey.status == APIKeyStatus.ACTIVE,
            APIKey.current_hour_requests >= (APIKey.requests_per_hour * 0.8),
            APIKey.current_hour_requests < (APIKey.requests_per_hour * 0.9),
        ).all()

        keys_at_90 = db.query(APIKey).filter(
            APIKey.status == APIKeyStatus.ACTIVE,
            APIKey.current_hour_requests >= (APIKey.requests_per_hour * 0.9),
            APIKey.current_hour_requests < APIKey.requests_per_hour,
        ).all()

        alerts_sent = 0

        # In production, send email/notification here
        # For now, just log
        for key in keys_at_80:
            logger.warning(
                f"API key '{key.name}' ({key.id}) at 80% of rate limit: "
                f"{key.current_hour_requests}/{key.requests_per_hour}"
            )
            alerts_sent += 1

        for key in keys_at_90:
            logger.warning(
                f"API key '{key.name}' ({key.id}) at 90% of rate limit: "
                f"{key.current_hour_requests}/{key.requests_per_hour}"
            )
            alerts_sent += 1

        return {
            "status": "success",
            "alerts_sent": alerts_sent,
            "keys_at_80_percent": len(keys_at_80),
            "keys_at_90_percent": len(keys_at_90),
        }

    except Exception as e:
        logger.error(f"Error sending usage alerts: {e}")
        return {
            "status": "error",
            "error": str(e),
        }
