"""Analytics tasks for Celery"""
import logging
from typing import Optional, List
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
    service = get_platform_service(connection.platform_type)
    if not service:
        logger.warning(f"No service available for platform: {connection.platform_type}")
        return {"status": "skipped", "platform": connection.platform_type.value}

    try:
        # Check if token needs refresh
        if service.is_token_expired(connection.token_expires_at):
            if connection.refresh_token:
                token_data = await service.refresh_access_token(connection.refresh_token)
                connection.access_token = token_data["access_token"]
                connection.token_expires_at = service.get_token_expiry(token_data["expires_in"])
                db_session.commit()
            else:
                connection.is_active = False
                connection.sync_error = "Token expired, no refresh token"
                db_session.commit()
                return {"status": "error", "platform": connection.platform_type.value, "error": "Token expired"}

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
def calculate_momentum_task(artist_id: str) -> Optional[float]:
    """
    Calculate momentum index for an artist

    Args:
        artist_id: Artist UUID

    Returns:
        Momentum score (0-10) or None if failed
    """
    try:
        logger.info(f"Calculating momentum for artist: {artist_id}")

        # TODO: Implement momentum calculation
        # - Fetch recent stream data
        # - Calculate moving averages
        # - Run momentum algorithm
        # - Store result

        return 7.5  # Placeholder
    except Exception as e:
        logger.error(f"Error calculating momentum: {e}")
        return None
