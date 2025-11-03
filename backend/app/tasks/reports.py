"""White-Label Reports background tasks"""
import logging
from datetime import datetime, timedelta
from app.core.celery_app import celery_app
from app.core.database import get_db_sync
from app.models.report import ReportTemplate, GeneratedReport
from app.models.artist import Artist
from app.services.report_generator import get_report_generator

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.reports.generate_scheduled_reports")
def generate_scheduled_reports_task() -> dict:
    """
    Generate scheduled reports

    Runs daily to check for templates with scheduled generation
    and creates reports for all artists belonging to the user.

    Returns:
        Summary of report generation
    """
    try:
        logger.info("Starting scheduled report generation")

        db = next(get_db_sync())

        # Get all templates that are scheduled
        templates = db.query(ReportTemplate).filter(
            ReportTemplate.is_scheduled == True,
            ReportTemplate.next_run_at.isnot(None),
            ReportTemplate.next_run_at <= datetime.utcnow(),
        ).all()

        if not templates:
            logger.info("No scheduled reports due for generation")
            return {
                "status": "success",
                "reports_generated": 0,
                "message": "No scheduled reports due",
            }

        reports_generated = 0
        failed_count = 0

        generator = get_report_generator(db)

        for template in templates:
            try:
                # Get all artists for this user
                artists = db.query(Artist).filter(
                    Artist.user_id == template.user_id
                ).all()

                if not artists:
                    logger.warning(f"No artists found for user {template.user_id}")
                    continue

                # Generate report for each artist
                for artist in artists:
                    try:
                        report = generator.generate_report(
                            user_id=str(template.user_id),
                            artist_id=str(artist.id),
                            template_id=str(template.id),
                        )

                        reports_generated += 1

                        logger.info(
                            f"Generated scheduled report for {artist.name} "
                            f"using template '{template.name}'"
                        )

                    except Exception as e:
                        logger.error(
                            f"Failed to generate report for artist {artist.id}: {e}"
                        )
                        failed_count += 1

                # Update next run time
                template.next_run_at = _calculate_next_run_time(template)
                db.commit()

            except Exception as e:
                logger.error(
                    f"Failed to process template {template.id}: {e}"
                )
                failed_count += 1
                db.rollback()

        logger.info(
            f"Scheduled report generation complete: {reports_generated} generated, "
            f"{failed_count} failed"
        )

        return {
            "status": "success",
            "reports_generated": reports_generated,
            "reports_failed": failed_count,
        }

    except Exception as e:
        logger.error(f"Error in scheduled report generation: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


@celery_app.task(name="app.tasks.reports.cleanup_old_reports")
def cleanup_old_reports_task() -> dict:
    """
    Clean up old report files

    Deletes report files older than 90 days to save storage space.
    Runs weekly.

    Returns:
        Summary of cleanup
    """
    try:
        logger.info("Starting cleanup of old reports")

        db = next(get_db_sync())

        # Delete reports older than 90 days
        ninety_days_ago = datetime.utcnow() - timedelta(days=90)

        old_reports = db.query(GeneratedReport).filter(
            GeneratedReport.created_at < ninety_days_ago
        ).all()

        if not old_reports:
            logger.info("No old reports to clean up")
            return {
                "status": "success",
                "reports_deleted": 0,
            }

        deleted_count = 0

        for report in old_reports:
            try:
                # Delete files
                import os
                if report.pdf_file_path and os.path.exists(report.pdf_file_path):
                    os.remove(report.pdf_file_path)
                if report.html_file_path and os.path.exists(report.html_file_path):
                    os.remove(report.html_file_path)

                # Delete database record
                db.delete(report)
                deleted_count += 1

            except Exception as e:
                logger.error(f"Failed to delete report {report.id}: {e}")
                db.rollback()
                continue

        db.commit()

        logger.info(f"Cleaned up {deleted_count} old reports")

        return {
            "status": "success",
            "reports_deleted": deleted_count,
        }

    except Exception as e:
        logger.error(f"Error cleaning up old reports: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


def _calculate_next_run_time(template: ReportTemplate) -> datetime:
    """Calculate next scheduled run time for a template"""
    now = datetime.utcnow()

    if template.schedule_frequency == "weekly":
        # Schedule for next week, same day
        days_ahead = template.schedule_day_of_week - now.weekday()
        if days_ahead <= 0:  # Target day already passed this week
            days_ahead += 7
        return now + timedelta(days=days_ahead)

    elif template.schedule_frequency == "monthly":
        # Schedule for next month, same day
        if now.day < template.schedule_day_of_month:
            # This month
            return now.replace(day=template.schedule_day_of_month)
        else:
            # Next month
            if now.month == 12:
                return now.replace(year=now.year + 1, month=1, day=template.schedule_day_of_month)
            else:
                return now.replace(month=now.month + 1, day=template.schedule_day_of_month)

    elif template.schedule_frequency == "quarterly":
        # Schedule for 3 months ahead
        return now + timedelta(days=90)

    else:
        # Default to 30 days ahead
        return now + timedelta(days=30)
