"""Email tasks for Celery"""
import logging
from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.email.send_email")
def send_email_task(to_email: str, subject: str, html_content: str) -> bool:
    """
    Send email task (async)

    Args:
        to_email: Recipient email
        subject: Email subject
        html_content: HTML content

    Returns:
        True if successful
    """
    try:
        # TODO: Implement actual email sending with SendGrid
        logger.info(f"Sending email to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return False


@celery_app.task(name="app.tasks.email.send_password_reset")
def send_password_reset_task(to_email: str, reset_token: str) -> bool:
    """
    Send password reset email task

    Args:
        to_email: User email
        reset_token: Reset token

    Returns:
        True if successful
    """
    frontend_url = "http://localhost:3000"
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"

    html_content = f"""
    <html>
        <body>
            <h2>Password Reset Request</h2>
            <p>Click the link below to reset your password:</p>
            <a href="{reset_link}">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
        </body>
    </html>
    """

    return send_email_task(to_email, "Password Reset - FanPulse", html_content)


@celery_app.task(name="app.tasks.email.send_alert_email")
def send_alert_email(notification_id: str) -> bool:
    """
    Send alert notification email

    Args:
        notification_id: Notification UUID

    Returns:
        True if successful
    """
    from app.core.database import get_db_sync
    from app.models.alert_rule import Notification
    from app.models.user import User
    from app.models.artist import Artist

    try:
        db = next(get_db_sync())

        # Get notification
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            logger.error(f"Notification {notification_id} not found")
            return False

        # Get user and artist
        user = db.query(User).filter(User.id == notification.user_id).first()
        if not user:
            logger.error(f"User {notification.user_id} not found")
            return False

        # Get artist name from alert if available
        artist_name = "Your artist"
        if notification.alert:
            artist = db.query(Artist).filter(Artist.id == notification.alert.artist_id).first()
            if artist:
                artist_name = artist.name

        # Create email content
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #3b82f6; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">FanPulse Alert</h1>
                </div>
                <div style="padding: 20px; background-color: #f9fafb;">
                    <h2 style="color: #1f2937;">{notification.title}</h2>
                    <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                        {notification.message}
                    </p>
                    <p style="color: #6b7280; font-size: 14px;">
                        <strong>Artist:</strong> {artist_name}
                    </p>
                    <div style="margin-top: 30px; text-align: center;">
                        <a href="http://localhost:3000/dashboard"
                           style="background-color: #3b82f6; color: white; padding: 12px 24px;
                                  text-decoration: none; border-radius: 6px; display: inline-block;">
                            View Dashboard
                        </a>
                    </div>
                </div>
                <div style="padding: 20px; background-color: #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
                    <p>You received this email because you have alerts configured in FanPulse.</p>
                    <p>© 2025 FanPulse. All rights reserved.</p>
                </div>
            </body>
        </html>
        """

        return send_email_task(user.email, notification.title, html_content)

    except Exception as e:
        logger.error(f"Error sending alert email for notification {notification_id}: {e}")
        return False
