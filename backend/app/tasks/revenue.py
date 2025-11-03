"""Revenue Forecasting background tasks"""
import logging
from datetime import datetime, timedelta
from app.core.celery_app import celery_app
from app.core.database import get_db_sync
from app.models.artist import Artist
from app.models.revenue import RevenueForecast
from app.services.revenue_forecasting import RevenueForecaster

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.revenue.calculate_revenue_forecasts")
def calculate_revenue_forecasts_task() -> dict:
    """
    Calculate revenue forecasts for all artists

    Runs monthly (1st of each month) via Celery Beat to generate
    fresh 12-month forecasts for all artists.

    Returns:
        Summary of calculations
    """
    try:
        logger.info("Starting revenue forecasts calculation batch")

        db = next(get_db_sync())

        # Get all artists
        artists = db.query(Artist).all()

        if not artists:
            logger.warning("No artists found for revenue forecast calculation")
            return {
                "status": "success",
                "artists_processed": 0,
                "message": "No artists to process",
            }

        forecaster = RevenueForecaster(db)
        success_count = 0
        failed_count = 0
        total_forecasts_saved = 0

        for artist in artists:
            try:
                # Calculate forecasts for 12 months
                forecasts = forecaster.forecast_revenue(str(artist.id), months_ahead=12)

                # Save to database
                saved = forecaster.save_forecasts(forecasts)
                total_forecasts_saved += saved

                success_count += 1
                logger.info(
                    f"Calculated revenue forecasts for artist {artist.name} "
                    f"({saved} forecasts saved)"
                )

            except Exception as e:
                logger.error(f"Failed to calculate forecasts for artist {artist.id}: {e}")
                failed_count += 1
                db.rollback()

        logger.info(
            f"Revenue forecasts calculation complete: {success_count} succeeded, "
            f"{failed_count} failed, {total_forecasts_saved} total forecasts"
        )

        return {
            "status": "success",
            "artists_processed": success_count,
            "artists_failed": failed_count,
            "total_artists": len(artists),
            "total_forecasts_saved": total_forecasts_saved,
        }

    except Exception as e:
        logger.error(f"Error in revenue forecasts calculation batch: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


@celery_app.task(name="app.tasks.revenue.cleanup_old_forecasts")
def cleanup_old_forecasts_task() -> dict:
    """
    Clean up old revenue forecasts

    Deletes forecasts older than 6 months to keep database clean.
    Runs monthly via Celery Beat.

    Returns:
        Summary of cleanup
    """
    try:
        logger.info("Starting old revenue forecasts cleanup")

        db = next(get_db_sync())

        # Delete forecasts older than 6 months
        six_months_ago = datetime.utcnow() - timedelta(days=180)

        deleted_count = db.query(RevenueForecast).filter(
            RevenueForecast.calculated_at < six_months_ago
        ).delete(synchronize_session=False)

        db.commit()

        logger.info(f"Cleaned up {deleted_count} old revenue forecasts")

        return {
            "status": "success",
            "forecasts_deleted": deleted_count,
        }

    except Exception as e:
        logger.error(f"Error in revenue forecasts cleanup: {e}")
        return {
            "status": "error",
            "error": str(e),
        }
