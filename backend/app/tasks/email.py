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
