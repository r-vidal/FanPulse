"""Analytics tasks for Celery"""
import logging
from typing import Optional, List, Dict
from datetime import datetime
from sqlalchemy import select
from app.core.celery_app import celery_app
from app.core.database import get_db_sync
from app.models.artist import Artist
from app.models.platform import PlatformConnection, PlatformType
from app.models.stream_history import StreamHistory
from app.models.social_post import SocialPost
from app.services.platforms.spotify import SpotifyService
from app.services.platforms.apple_music import AppleMusicService
from app.services.platforms.instagram import InstagramService
from app.services.platforms.tiktok import TikTokService
import asyncio

logger = logging.getLogger(__name__)


def get_platform_service(platform_type: PlatformType):
    """Factory function to get the appropriate platform service"""
    services = {
        PlatformType.SPOTIFY: SpotifyService,
        PlatformType.APPLE_MUSIC: AppleMusicService,
        PlatformType.INSTAGRAM: InstagramService,
        PlatformType.TIKTOK: TikTokService,
    }
    service_class = services.get(platform_type)
    if service_class:
        return service_class()
    return None


async def fetch_platform_data_async(connection: PlatformConnection, db_session) -> dict:
    """
    Async helper to fetch data from a single platform connection
    """
    from app.services.token_manager import token_manager

    service = get_platform_service(connection.platform_type)
    if not service:
        logger.warning(f"No service available for platform: {connection.platform_type}")
        return {"status": "skipped", "platform": connection.platform_type.value}

    try:
        # Ensure token is valid (auto-refresh if needed)
        try:
            access_token = await token_manager.ensure_valid_token(connection, db_session)
        except Exception as token_error:
            logger.error(f"Failed to validate token: {token_error}")
            return {
                "status": "error",
                "platform": connection.platform_type.value,
                "error": f"Token validation failed: {str(token_error)}"
            }

        # Fetch streaming/analytics data
        if connection.platform_type in [PlatformType.SPOTIFY, PlatformType.APPLE_MUSIC]:
            stats = await service.get_streaming_stats(
                connection.platform_artist_id,
                connection.access_token,
            )

            # Store in stream_history
            stream_entry = StreamHistory(
                artist_id=connection.artist_id,
                platform_connection_id=connection.id,
                timestamp=datetime.utcnow(),
                total_streams=stats.get("total_streams", 0),
                monthly_listeners=stats.get("monthly_listeners", 0),
                followers=stats.get("followers", 0),
                raw_data=stats.get("raw_data", {}),
            )
            db_session.add(stream_entry)

        # Fetch social media data
        elif connection.platform_type in [PlatformType.INSTAGRAM, PlatformType.TIKTOK]:
            # Get profile stats
            profile = await service.get_artist_data(
                connection.platform_artist_id,
                connection.access_token,
            )

            # Store profile stats in stream_history (reuse for follower tracking)
            stream_entry = StreamHistory(
                artist_id=connection.artist_id,
                platform_connection_id=connection.id,
                timestamp=datetime.utcnow(),
                followers=profile.get("followers", 0),
                raw_data=profile,
            )
            db_session.add(stream_entry)

            # Fetch recent posts
            if connection.platform_type == PlatformType.INSTAGRAM:
                media = await service.get_recent_media(
                    connection.platform_artist_id,
                    connection.access_token,
                    limit=10,
                )
            elif connection.platform_type == PlatformType.TIKTOK:
                media = await service.get_user_videos(
                    connection.platform_artist_id,
                    connection.access_token,
                    limit=10,
                )

            # Store posts that don't already exist
            for item in media:
                platform_post_id = item.get("id")

                # Check if post already exists
                existing = db_session.execute(
                    select(SocialPost).where(SocialPost.platform_post_id == platform_post_id)
                ).scalar_one_or_none()

                if not existing:
                    post = SocialPost(
                        artist_id=connection.artist_id,
                        platform_connection_id=connection.id,
                        platform_post_id=platform_post_id,
                        post_type=item.get("media_type", "unknown"),
                        caption=item.get("caption") or item.get("description", ""),
                        media_url=item.get("media_url"),
                        thumbnail_url=item.get("thumbnail_url") or item.get("cover_url"),
                        permalink=item.get("permalink") or item.get("share_url"),
                        likes=item.get("likes", 0),
                        comments=item.get("comments", 0),
                        shares=item.get("shares", 0),
                        views=item.get("views", 0),
                        posted_at=item.get("timestamp") or item.get("created_at") or datetime.utcnow(),
                        raw_data=item,
                    )
                    db_session.add(post)

        # Update connection
        connection.last_synced_at = datetime.utcnow()
        connection.sync_error = None
        db_session.commit()

        await service.close()

        return {
            "status": "success",
            "platform": connection.platform_type.value,
        }

    except Exception as e:
        logger.error(f"Error fetching data from {connection.platform_type}: {e}")
        connection.sync_error = str(e)
        db_session.commit()

        if service:
            await service.close()

        return {
            "status": "error",
            "platform": connection.platform_type.value,
            "error": str(e),
        }


@celery_app.task(name="app.tasks.analytics.fetch_artist_data")
def fetch_artist_data(artist_id: str) -> dict:
    """
    Fetch artist data from all connected platforms

    Args:
        artist_id: Artist UUID

    Returns:
        Dictionary with fetched data
    """
    try:
        logger.info(f"Fetching data for artist: {artist_id}")

        # Get database session (sync version for Celery)
        db = next(get_db_sync())

        # Get all active platform connections for this artist
        result = db.execute(
            select(PlatformConnection).where(
                PlatformConnection.artist_id == artist_id,
                PlatformConnection.is_active == True,
            )
        )
        connections = result.scalars().all()

        if not connections:
            logger.warning(f"No active platform connections for artist: {artist_id}")
            return {
                "artist_id": artist_id,
                "status": "success",
                "platforms_synced": 0,
                "message": "No active platform connections",
            }

        # Fetch data from each platform asynchronously
        results = []
        for connection in connections:
            try:
                result = asyncio.run(fetch_platform_data_async(connection, db))
                results.append(result)
            except Exception as e:
                logger.error(f"Error in async fetch: {e}")
                results.append({
                    "status": "error",
                    "platform": connection.platform_type.value,
                    "error": str(e),
                })

        successful = sum(1 for r in results if r["status"] == "success")

        return {
            "artist_id": artist_id,
            "status": "success",
            "platforms_synced": successful,
            "total_platforms": len(connections),
            "results": results,
        }

    except Exception as e:
        logger.error(f"Error fetching artist data: {e}")
        return {
            "artist_id": artist_id,
            "status": "error",
            "error": str(e),
        }


@celery_app.task(name="app.tasks.analytics.fetch_all_artist_data")
def fetch_all_artist_data() -> dict:
    """
    Fetch data for all artists with active platform connections (periodic task)

    This task runs daily via Celery Beat to sync data from all platforms

    Returns:
        Summary of fetch operation
    """
    try:
        logger.info("Starting batch fetch for all artists")

        # Get database session
        db = next(get_db_sync())

        # Get all artists with active platform connections
        result = db.execute(
            select(Artist.id)
            .join(PlatformConnection)
            .where(PlatformConnection.is_active == True)
            .distinct()
        )
        artist_ids = [str(row[0]) for row in result.all()]

        if not artist_ids:
            logger.warning("No artists with active platform connections found")
            return {
                "status": "success",
                "artists_processed": 0,
                "message": "No active artists",
            }

        logger.info(f"Queueing data fetch for {len(artist_ids)} artists")

        # Queue fetch tasks for each artist
        for artist_id in artist_ids:
            fetch_artist_data.delay(artist_id)

        return {
            "status": "success",
            "artists_queued": len(artist_ids),
            "message": f"Queued data fetch for {len(artist_ids)} artists",
        }

    except Exception as e:
        logger.error(f"Error in batch fetch: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


@celery_app.task(name="app.tasks.analytics.calculate_momentum")
def calculate_momentum_task(artist_id: str) -> Optional[Dict]:
    """
    Calculate momentum index for an artist

    Args:
        artist_id: Artist UUID

    Returns:
        Momentum data or None if failed
    """
    try:
        logger.info(f"Calculating momentum for artist: {artist_id}")

        # Get database session
        db = next(get_db_sync())

        # Import momentum calculator
        from app.services.analytics.momentum import MomentumCalculator
        from app.models.momentum import MomentumScore

        # Calculate momentum
        calculator = MomentumCalculator(db)
        result = calculator.calculate_momentum(artist_id, days=30)

        # Store result in database
        momentum_entry = MomentumScore(
            artist_id=artist_id,
            momentum_index=result["momentum_index"],
            velocity_score=result["breakdown"]["velocity"],
            acceleration_score=result["breakdown"]["acceleration"],
            consistency_score=result["breakdown"]["consistency"],
            viral_score=result["breakdown"]["viral_potential"],
            status=result["status"],
            trend=result["trend"],
            calculated_at=datetime.utcnow(),
        )
        db.add(momentum_entry)
        db.commit()

        logger.info(f"Momentum calculated for {artist_id}: {result['momentum_index']}")

        return {
            "artist_id": artist_id,
            "momentum_index": result["momentum_index"],
            "status": result["status"],
        }

    except Exception as e:
        logger.error(f"Error calculating momentum: {e}")
        return None


@celery_app.task(name="app.tasks.analytics.calculate_all_momentum")
def calculate_all_momentum() -> dict:
    """
    Calculate momentum for all artists (periodic task)

    This task runs every 6 hours via Celery Beat

    Returns:
        Summary of calculation operation
    """
    try:
        logger.info("Starting batch momentum calculation for all artists")

        # Get database session
        db = next(get_db_sync())

        # Get all artists with active platform connections
        result = db.execute(
            select(Artist.id)
            .join(PlatformConnection)
            .where(PlatformConnection.is_active == True)
            .distinct()
        )
        artist_ids = [str(row[0]) for row in result.all()]

        if not artist_ids:
            logger.warning("No artists with active platform connections found")
            return {
                "status": "success",
                "artists_processed": 0,
                "message": "No active artists",
            }

        logger.info(f"Queueing momentum calculation for {len(artist_ids)} artists")

        # Queue momentum tasks for each artist
        for artist_id in artist_ids:
            calculate_momentum_task.delay(artist_id)

        return {
            "status": "success",
            "artists_queued": len(artist_ids),
            "message": f"Queued momentum calculation for {len(artist_ids)} artists",
        }

    except Exception as e:
        logger.error(f"Error in batch momentum calculation: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


@celery_app.task(name="app.tasks.analytics.calculate_fvs")
def calculate_fvs_task(artist_id: str) -> Optional[Dict]:
    """
    Calculate Fan Value Score (FVS) for an artist

    Args:
        artist_id: Artist UUID

    Returns:
        FVS data or None if failed
    """
    try:
        logger.info(f"Calculating FVS for artist: {artist_id}")

        # Get database session
        db = next(get_db_sync())

        # Import FVS calculator
        from app.services.analytics.fvs import FVSCalculator

        # Calculate FVS
        calculator = FVSCalculator(db)
        result = calculator.calculate_fvs(artist_id, days=30)

        # Note: FVS is typically calculated on-demand, but we can cache it
        # For now, just log it. In production, you might store in Redis or a table
        logger.info(f"FVS calculated for {artist_id}: {result['fvs']}")

        return {
            "artist_id": artist_id,
            "fvs": result["fvs"],
            "calculated_at": result["calculated_at"],
        }

    except Exception as e:
        logger.error(f"Error calculating FVS: {e}")
        return None


@celery_app.task(name="app.tasks.analytics.calculate_all_fvs")
def calculate_all_fvs() -> dict:
    """
    Calculate FVS for all artists (periodic task)

    This task runs daily at 3 AM UTC via Celery Beat

    Returns:
        Summary of calculation operation
    """
    try:
        logger.info("Starting batch FVS calculation for all artists")

        # Get database session
        db = next(get_db_sync())

        # Get all artists with active platform connections
        result = db.execute(
            select(Artist.id)
            .join(PlatformConnection)
            .where(PlatformConnection.is_active == True)
            .distinct()
        )
        artist_ids = [str(row[0]) for row in result.all()]

        if not artist_ids:
            logger.warning("No artists with active platform connections found")
            return {
                "status": "success",
                "artists_processed": 0,
                "message": "No active artists",
            }

        logger.info(f"Queueing FVS calculation for {len(artist_ids)} artists")

        # Queue FVS tasks for each artist
        for artist_id in artist_ids:
            calculate_fvs_task.delay(artist_id)

        return {
            "status": "success",
            "artists_queued": len(artist_ids),
            "message": f"Queued FVS calculation for {len(artist_ids)} artists",
        }

    except Exception as e:
        logger.error(f"Error in batch FVS calculation: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


@celery_app.task(name="app.tasks.analytics.detect_viral_spikes")
def detect_viral_spikes_task(artist_id: str) -> Optional[Dict]:
    """
    Detect viral spikes for an artist and create alerts if needed

    Args:
        artist_id: Artist UUID

    Returns:
        Detection results or None if failed
    """
    try:
        logger.info(f"Detecting viral spikes for artist: {artist_id}")

        # Get database session
        db = next(get_db_sync())

        # Import momentum calculator (includes viral detection)
        from app.services.analytics.momentum import MomentumCalculator
        from app.models.alert import Alert, AlertType, AlertUrgency

        calculator = MomentumCalculator(db)

        # Use breakout prediction which includes viral detection
        prediction = calculator.predict_breakout(artist_id)

        # Create alert if viral content detected
        if prediction["prediction"] == "high" and prediction["indicators"]["viral_content"]:
            # Check if similar alert already exists in last 24 hours
            cutoff = datetime.utcnow() - timedelta(hours=24)
            existing_alert = db.execute(
                select(Alert).where(
                    Alert.artist_id == artist_id,
                    Alert.alert_type == AlertType.VIRAL_SPIKE,
                    Alert.created_at >= cutoff,
                )
            ).scalar_one_or_none()

            if not existing_alert:
                # Get artist to get user_id
                artist = db.query(Artist).filter(Artist.id == artist_id).first()
                if artist:
                    alert = Alert(
                        user_id=artist.user_id,
                        artist_id=artist_id,
                        alert_type=AlertType.VIRAL_SPIKE,
                        urgency=AlertUrgency.HIGH,
                        title="🔥 Viral Content Detected!",
                        message=f"Your content is going viral! Momentum index: {prediction['momentum_index']}/10. "
                        f"Probability of breakout: {int(prediction['probability'] * 100)}%. "
                        f"{prediction['recommendation']}",
                        metadata={
                            "momentum_index": prediction["momentum_index"],
                            "probability": prediction["probability"],
                            "indicators": prediction["indicators"],
                        },
                    )
                    db.add(alert)
                    db.commit()
                    logger.info(f"Created viral spike alert for artist {artist_id}")

        return {
            "artist_id": artist_id,
            "prediction": prediction["prediction"],
            "probability": prediction["probability"],
            "viral_detected": prediction["indicators"]["viral_content"],
        }

    except Exception as e:
        logger.error(f"Error detecting viral spikes: {e}")
        return None


@celery_app.task(name="app.tasks.analytics.detect_all_viral_spikes")
def detect_all_viral_spikes() -> dict:
    """
    Detect viral spikes for all artists (periodic task)

    This task runs every 3 hours via Celery Beat

    Returns:
        Summary of detection operation
    """
    try:
        logger.info("Starting batch viral spike detection for all artists")

        # Get database session
        db = next(get_db_sync())

        # Get all artists with active platform connections
        result = db.execute(
            select(Artist.id)
            .join(PlatformConnection)
            .where(PlatformConnection.is_active == True)
            .distinct()
        )
        artist_ids = [str(row[0]) for row in result.all()]

        if not artist_ids:
            logger.warning("No artists with active platform connections found")
            return {
                "status": "success",
                "artists_processed": 0,
                "message": "No active artists",
            }

        logger.info(f"Queueing viral spike detection for {len(artist_ids)} artists")

        # Queue detection tasks for each artist
        for artist_id in artist_ids:
            detect_viral_spikes_task.delay(artist_id)

        return {
            "status": "success",
            "artists_queued": len(artist_ids),
            "message": f"Queued viral spike detection for {len(artist_ids)} artists",
        }

    except Exception as e:
        logger.error(f"Error in batch viral spike detection: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


@celery_app.task(name="app.tasks.analytics.refresh_expiring_tokens")
def refresh_expiring_tokens() -> dict:
    """
    Refresh OAuth tokens that are about to expire

    This task runs hourly via Celery Beat to proactively refresh tokens
    before they expire, preventing authentication errors.

    Returns:
        Summary of refresh operation with success/failure counts
    """
    try:
        logger.info("Starting token refresh batch")

        # Get database session
        db = next(get_db_sync())

        # Import token manager
        from app.services.token_manager import token_manager

        # Run the refresh operation
        results = asyncio.run(token_manager.refresh_all_expiring_tokens(db))

        logger.info(
            f"Token refresh complete: {results['success']}/{results['total']} succeeded, "
            f"{results['failed']} failed"
        )

        return results

    except Exception as e:
        logger.error(f"Error in token refresh task: {e}")
        return {
            "status": "error",
            "error": str(e),
        }
