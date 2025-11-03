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


@celery_app.task(name="app.tasks.email.send_weekly_reports")
def send_weekly_reports() -> dict:
    """
    Send weekly summary reports to all users

    Runs every Monday at 8 AM UTC via Celery Beat

    Returns:
        Summary of emails sent
    """
    from app.core.database import get_db_sync
    from app.models.user import User
    from app.models.artist import Artist
    from app.models.stream_history import StreamHistory
    from datetime import datetime, timedelta
    from sqlalchemy import func

    try:
        logger.info("Starting weekly email reports batch")

        db = next(get_db_sync())

        # Get all users with artists
        users_with_artists = db.query(User).join(Artist).distinct().all()

        if not users_with_artists:
            logger.warning("No users with artists found for weekly reports")
            return {
                "status": "success",
                "emails_sent": 0,
                "message": "No users with artists",
            }

        emails_sent = 0
        emails_failed = 0

        for user in users_with_artists:
            try:
                # Get user's artists
                artists = db.query(Artist).filter(Artist.user_id == user.id).all()

                # Calculate week-over-week stats for each artist
                one_week_ago = datetime.utcnow() - timedelta(days=7)
                two_weeks_ago = datetime.utcnow() - timedelta(days=14)

                artist_stats = []

                for artist in artists:
                    # Get streams for this week
                    this_week = db.query(func.avg(StreamHistory.monthly_listeners)).filter(
                        StreamHistory.artist_id == artist.id,
                        StreamHistory.timestamp >= one_week_ago
                    ).scalar() or 0

                    # Get streams for last week
                    last_week = db.query(func.avg(StreamHistory.monthly_listeners)).filter(
                        StreamHistory.artist_id == artist.id,
                        StreamHistory.timestamp >= two_weeks_ago,
                        StreamHistory.timestamp < one_week_ago
                    ).scalar() or 0

                    # Calculate change
                    change_pct = 0
                    if last_week > 0:
                        change_pct = ((this_week - last_week) / last_week) * 100

                    # Get most recent follower count
                    latest_followers = db.query(StreamHistory.followers).filter(
                        StreamHistory.artist_id == artist.id,
                        StreamHistory.followers.isnot(None)
                    ).order_by(StreamHistory.timestamp.desc()).first()

                    followers = latest_followers[0] if latest_followers else 0

                    artist_stats.append({
                        "name": artist.name,
                        "monthly_listeners": int(this_week),
                        "change_pct": round(change_pct, 1),
                        "followers": int(followers),
                    })

                # Generate HTML email
                artist_rows = ""
                for stats in artist_stats:
                    change_color = "#10b981" if stats["change_pct"] >= 0 else "#ef4444"
                    change_arrow = "↑" if stats["change_pct"] >= 0 else "↓"

                    artist_rows += f"""
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 12px; font-weight: 500;">{stats['name']}</td>
                        <td style="padding: 12px; text-align: center;">{stats['monthly_listeners']:,}</td>
                        <td style="padding: 12px; text-align: center; color: {change_color};">
                            {change_arrow} {abs(stats['change_pct'])}%
                        </td>
                        <td style="padding: 12px; text-align: center;">{stats['followers']:,}</td>
                    </tr>
                    """

                html_content = f"""
                <html>
                    <body style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background-color: #f9fafb;">
                        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">🎵 FanPulse Weekly Report</h1>
                            <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">
                                Week of {one_week_ago.strftime('%B %d')} - {datetime.utcnow().strftime('%B %d, %Y')}
                            </p>
                        </div>

                        <div style="padding: 30px; background-color: white;">
                            <h2 style="color: #1f2937; margin-top: 0;">Your Artist Performance</h2>

                            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                                <thead>
                                    <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                                        <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 600;">Artist</th>
                                        <th style="padding: 12px; text-align: center; color: #6b7280; font-weight: 600;">Monthly Listeners</th>
                                        <th style="padding: 12px; text-align: center; color: #6b7280; font-weight: 600;">Change</th>
                                        <th style="padding: 12px; text-align: center; color: #6b7280; font-weight: 600;">Followers</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {artist_rows}
                                </tbody>
                            </table>

                            <div style="margin-top: 30px; padding: 20px; background-color: #eff6ff; border-radius: 8px;">
                                <h3 style="color: #1e40af; margin-top: 0;">📊 Want deeper insights?</h3>
                                <p style="color: #1e3a8a; margin: 10px 0;">
                                    View detailed analytics, momentum trends, and superfan analysis in your dashboard.
                                </p>
                            </div>

                            <div style="margin-top: 30px; text-align: center;">
                                <a href="http://localhost:3000/dashboard"
                                   style="background-color: #3b82f6; color: white; padding: 14px 28px;
                                          text-decoration: none; border-radius: 8px; display: inline-block;
                                          font-weight: 600;">
                                    View Full Dashboard →
                                </a>
                            </div>
                        </div>

                        <div style="padding: 20px; background-color: #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
                            <p>You're receiving this because you subscribed to weekly reports in FanPulse.</p>
                            <p style="margin-top: 5px;">
                                <a href="http://localhost:3000/settings" style="color: #3b82f6; text-decoration: none;">
                                    Manage email preferences
                                </a>
                            </p>
                            <p style="margin-top: 15px;">© 2025 FanPulse. All rights reserved.</p>
                        </div>
                    </body>
                </html>
                """

                # Send email
                success = send_email_task(
                    user.email,
                    f"🎵 Your Weekly FanPulse Report - {datetime.utcnow().strftime('%B %d, %Y')}",
                    html_content
                )

                if success:
                    emails_sent += 1
                else:
                    emails_failed += 1

            except Exception as e:
                logger.error(f"Error generating weekly report for user {user.id}: {e}")
                emails_failed += 1

        logger.info(
            f"Weekly reports batch complete: {emails_sent} sent, {emails_failed} failed"
        )

        return {
            "status": "success",
            "emails_sent": emails_sent,
            "emails_failed": emails_failed,
            "total_users": len(users_with_artists),
        }

    except Exception as e:
        logger.error(f"Error in weekly reports batch: {e}")
        return {
            "status": "error",
            "error": str(e),
        }
