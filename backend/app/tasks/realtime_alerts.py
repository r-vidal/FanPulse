"""Real-time Alerts background tasks"""
import logging
import asyncio
from datetime import datetime
from app.core.celery_app import celery_app
from app.core.database import get_db_sync
from app.models.user import User
from app.models.alert import Alert, AlertType, AlertSeverity
from app.services.opportunity_detector import get_opportunity_detector
from app.websocket.connection_manager import manager

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.realtime_alerts.scan_opportunities")
def scan_opportunities_task() -> dict:
    """
    Scan for opportunities and send real-time alerts

    Runs every 15 minutes to detect new opportunities and notify
    connected users via WebSocket.

    Returns:
        Summary of scan results
    """
    try:
        logger.info("Starting opportunity scan for real-time alerts")

        db = next(get_db_sync())

        # Get all users
        users = db.query(User).all()

        total_opportunities = 0
        alerts_sent = 0

        for user in users:
            try:
                # Skip if user is not connected
                if not manager.is_user_connected(str(user.id)):
                    continue

                # Detect opportunities
                detector = get_opportunity_detector(db)
                opportunities = detector.detect_all_opportunities(str(user.id))

                if not opportunities:
                    continue

                total_opportunities += len(opportunities)

                # Send each opportunity as a WebSocket alert
                for opp in opportunities:
                    try:
                        # Send via WebSocket
                        asyncio.run(manager.send_alert(opp, str(user.id)))
                        alerts_sent += 1

                        # Also create Alert record in database
                        alert = Alert(
                            user_id=user.id,
                            artist_id=opp.get("artist_id"),
                            alert_type=AlertType.OPPORTUNITY,
                            severity=_map_priority(opp.get("priority", "medium")),
                            message=f"{opp.get('title')}: {opp.get('message')}",
                            data=opp.get("data", {}),
                        )
                        db.add(alert)

                    except Exception as e:
                        logger.error(f"Failed to send alert for opportunity: {e}")

                db.commit()

            except Exception as e:
                logger.error(f"Error scanning opportunities for user {user.id}: {e}")
                db.rollback()
                continue

        logger.info(
            f"Opportunity scan complete: {total_opportunities} opportunities found, "
            f"{alerts_sent} alerts sent"
        )

        return {
            "status": "success",
            "opportunities_found": total_opportunities,
            "alerts_sent": alerts_sent,
            "users_scanned": len(users),
        }

    except Exception as e:
        logger.error(f"Error in opportunity scan task: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


@celery_app.task(name="app.tasks.realtime_alerts.send_heartbeat")
def send_heartbeat_task() -> dict:
    """
    Send heartbeat to all connected clients

    Runs every 30 seconds to keep WebSocket connections alive.

    Returns:
        Summary of heartbeat results
    """
    try:
        connected_users = manager.get_connected_users()

        if not connected_users:
            return {
                "status": "success",
                "message": "No connected users",
                "heartbeats_sent": 0,
            }

        heartbeats_sent = 0

        for user_id in connected_users:
            try:
                asyncio.run(manager.send_heartbeat(user_id))
                heartbeats_sent += 1
            except Exception as e:
                logger.error(f"Failed to send heartbeat to user {user_id}: {e}")

        return {
            "status": "success",
            "heartbeats_sent": heartbeats_sent,
            "connected_users": len(connected_users),
        }

    except Exception as e:
        logger.error(f"Error in heartbeat task: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


@celery_app.task(name="app.tasks.realtime_alerts.cleanup_old_alerts")
def cleanup_old_alerts_task() -> dict:
    """
    Clean up old alert records from database

    Runs daily to delete alerts older than 30 days.

    Returns:
        Summary of cleanup
    """
    try:
        logger.info("Starting cleanup of old alerts")

        db = next(get_db_sync())

        # Delete alerts older than 30 days
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        deleted_count = db.query(Alert).filter(
            Alert.created_at < thirty_days_ago
        ).delete(synchronize_session=False)

        db.commit()

        logger.info(f"Cleaned up {deleted_count} old alerts")

        return {
            "status": "success",
            "alerts_deleted": deleted_count,
        }

    except Exception as e:
        logger.error(f"Error cleaning up old alerts: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


def _map_priority(priority_str: str) -> AlertSeverity:
    """Map string priority to AlertSeverity enum"""
    mapping = {
        "low": AlertSeverity.INFO,
        "medium": AlertSeverity.WARNING,
        "high": AlertSeverity.URGENT,
        "critical": AlertSeverity.URGENT,
        "urgent": AlertSeverity.URGENT,
    }
    return mapping.get(priority_str.lower(), AlertSeverity.WARNING)
