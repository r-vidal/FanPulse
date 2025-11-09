"""
Publishing Tasks

Celery tasks for publishing scheduled posts to social media platforms
"""
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict
from sqlalchemy import select
from app.core.celery_app import celery_app
from app.core.database import get_db_sync
from app.models.scheduled_post import ScheduledPost, PostStatus
from app.models.platform import PlatformConnection, PlatformType

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.publishing.publish_post_task")
def publish_post_task(post_id: str) -> Optional[Dict]:
    """
    Publish a scheduled post to all selected platforms

    Args:
        post_id: ScheduledPost UUID

    Returns:
        Publication results or None if failed
    """
    try:
        logger.info(f"Publishing post: {post_id}")

        # Get database session
        db = next(get_db_sync())

        # Get post
        post = db.query(ScheduledPost).filter(ScheduledPost.id == post_id).first()

        if not post:
            logger.error(f"Post {post_id} not found")
            return None

        # Update status
        post.status = PostStatus.PUBLISHING
        db.commit()

        results = {}
        errors = []

        # Publish to each platform
        for platform in post.platforms:
            try:
                result = _publish_to_platform(post, platform, db)
                results[platform] = result
                logger.info(f"Published to {platform}: {result}")
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Failed to publish to {platform}: {error_msg}")
                errors.append(f"{platform}: {error_msg}")
                results[platform] = {"status": "error", "error": error_msg}

        # Update post with results
        post.publish_results = results
        post.published_at = datetime.utcnow()

        if errors:
            post.status = PostStatus.FAILED
            post.error_message = "; ".join(errors)
        else:
            post.status = PostStatus.PUBLISHED

        db.commit()

        return {
            "post_id": post_id,
            "status": post.status.value,
            "results": results,
            "errors": errors,
        }

    except Exception as e:
        logger.error(f"Error publishing post {post_id}: {e}")
        return None


def _publish_to_platform(post: ScheduledPost, platform: str, db) -> Dict:
    """
    Publish to a specific platform

    Args:
        post: ScheduledPost instance
        platform: Platform name (instagram, facebook, tiktok, etc.)
        db: Database session

    Returns:
        Publication result dict
    """
    # Get platform connection for this user
    platform_type_map = {
        "instagram": PlatformType.INSTAGRAM,
        "facebook": PlatformType.FACEBOOK,
        "tiktok": PlatformType.TIKTOK,
        "twitter": PlatformType.TWITTER,
    }

    platform_type = platform_type_map.get(platform)

    if not platform_type:
        raise ValueError(f"Unsupported platform: {platform}")

    # Find active connection
    connection = (
        db.query(PlatformConnection)
        .filter(
            PlatformConnection.user_id == post.user_id,
            PlatformConnection.platform_type == platform_type,
            PlatformConnection.is_active == True,
        )
        .first()
    )

    if not connection:
        raise ValueError(f"No active {platform} connection found")

    # Ensure token is valid
    from app.services.token_manager import token_manager
    import asyncio

    try:
        access_token = asyncio.run(token_manager.ensure_valid_token(connection, db))
    except Exception as e:
        raise ValueError(f"Failed to refresh token: {e}")

    # Publish based on platform
    if platform == "instagram":
        return _publish_to_instagram(post, connection, access_token)
    elif platform == "facebook":
        return _publish_to_facebook(post, connection, access_token)
    elif platform == "tiktok":
        return _publish_to_tiktok(post, connection, access_token)
    elif platform == "twitter":
        return _publish_to_twitter(post, connection, access_token)
    else:
        raise ValueError(f"Publishing not implemented for {platform}")


def _publish_to_instagram(post: ScheduledPost, connection: PlatformConnection, access_token: str) -> Dict:
    """
    Publish to Instagram using Graph API

    Instagram supports:
    - Feed posts (single image/video)
    - Carousel posts (multiple images)
    - Reels (short videos)
    - Stories
    """
    import httpx
    import asyncio

    async def publish():
        async with httpx.AsyncClient() as client:
            # Instagram Graph API endpoint
            ig_user_id = connection.platform_artist_id

            # Determine post type
            has_media = len(post.media_urls) > 0

            if not has_media:
                raise ValueError("Instagram posts require at least one media file")

            # For single image/video
            if len(post.media_urls) == 1:
                media_url = post.media_urls[0]

                # Determine media type (image or video)
                is_video = media_url.lower().endswith((".mp4", ".mov"))

                # Step 1: Create media container
                container_params = {
                    "access_token": access_token,
                    "caption": _format_caption(post.caption, post.hashtags),
                }

                if is_video:
                    container_params["media_type"] = "VIDEO"
                    container_params["video_url"] = media_url
                else:
                    container_params["image_url"] = media_url

                container_response = await client.post(
                    f"https://graph.facebook.com/v18.0/{ig_user_id}/media",
                    params=container_params,
                )

                container_data = container_response.json()

                if "id" not in container_data:
                    raise ValueError(f"Failed to create media container: {container_data}")

                container_id = container_data["id"]

                # Step 2: Publish media container
                publish_response = await client.post(
                    f"https://graph.facebook.com/v18.0/{ig_user_id}/media_publish",
                    params={"access_token": access_token, "creation_id": container_id},
                )

                publish_data = publish_response.json()

                if "id" not in publish_data:
                    raise ValueError(f"Failed to publish: {publish_data}")

                return {
                    "status": "success",
                    "post_id": publish_data["id"],
                    "platform": "instagram",
                    "url": f"https://www.instagram.com/p/{publish_data['id']}/",
                }

            # For carousel (multiple images)
            else:
                # TODO: Implement carousel publishing
                # Requires creating multiple containers then publishing together
                raise NotImplementedError("Instagram carousel posts not yet implemented")

    return asyncio.run(publish())


def _publish_to_facebook(post: ScheduledPost, connection: PlatformConnection, access_token: str) -> Dict:
    """Publish to Facebook Page"""
    import httpx
    import asyncio

    async def publish():
        async with httpx.AsyncClient() as client:
            page_id = connection.platform_artist_id

            params = {
                "access_token": access_token,
                "message": _format_caption(post.caption, post.hashtags),
            }

            # Add media if available
            if post.media_urls:
                # For single image
                if len(post.media_urls) == 1:
                    params["url"] = post.media_urls[0]
                    endpoint = f"https://graph.facebook.com/v18.0/{page_id}/photos"
                else:
                    # TODO: Implement multi-image posts
                    raise NotImplementedError("Facebook multi-image posts not yet implemented")
            else:
                # Text-only post
                endpoint = f"https://graph.facebook.com/v18.0/{page_id}/feed"

            response = await client.post(endpoint, params=params)
            data = response.json()

            if "id" not in data:
                raise ValueError(f"Facebook publish failed: {data}")

            return {
                "status": "success",
                "post_id": data["id"],
                "platform": "facebook",
                "url": f"https://www.facebook.com/{data['id']}",
            }

    return asyncio.run(publish())


def _publish_to_tiktok(post: ScheduledPost, connection: PlatformConnection, access_token: str) -> Dict:
    """
    Publish to TikTok

    Note: TikTok API for direct video upload is complex and requires
    special approval. This is a placeholder implementation.
    """
    # TODO: Implement TikTok Content Posting API
    # Requires: Video upload to TikTok's servers, then publish
    raise NotImplementedError(
        "TikTok publishing requires TikTok for Developers API access and video upload implementation"
    )


def _publish_to_twitter(post: ScheduledPost, connection: PlatformConnection, access_token: str) -> Dict:
    """Publish to Twitter/X"""
    import httpx
    import asyncio

    async def publish():
        async with httpx.AsyncClient() as client:
            # Twitter API v2
            headers = {"Authorization": f"Bearer {access_token}"}

            tweet_data = {"text": _format_caption(post.caption, post.hashtags, max_length=280)}

            # Add media if available (TODO: implement media upload)
            # Twitter requires uploading media first, then attaching to tweet

            response = await client.post(
                "https://api.twitter.com/2/tweets", headers=headers, json=tweet_data
            )

            data = response.json()

            if "data" not in data:
                raise ValueError(f"Twitter publish failed: {data}")

            tweet_id = data["data"]["id"]

            return {
                "status": "success",
                "post_id": tweet_id,
                "platform": "twitter",
                "url": f"https://twitter.com/i/web/status/{tweet_id}",
            }

    return asyncio.run(publish())


def _format_caption(caption: str, hashtags: list, max_length: int = 2200) -> str:
    """
    Format caption with hashtags

    Args:
        caption: Post caption
        hashtags: List of hashtags (without #)
        max_length: Maximum caption length

    Returns:
        Formatted caption
    """
    # Add hashtags
    hashtag_str = " ".join([f"#{tag}" for tag in hashtags])

    if hashtag_str:
        full_caption = f"{caption}\n\n{hashtag_str}"
    else:
        full_caption = caption

    # Truncate if needed
    if len(full_caption) > max_length:
        full_caption = full_caption[: max_length - 3] + "..."

    return full_caption


@celery_app.task(name="app.tasks.publishing.publish_scheduled_posts")
def publish_scheduled_posts() -> Dict:
    """
    Publish all scheduled posts that are due

    This task runs every minute via Celery Beat to check for posts
    that need to be published.

    Returns:
        Summary of publishing operation
    """
    try:
        logger.info("Checking for scheduled posts to publish")

        # Get database session
        db = next(get_db_sync())

        # Find posts scheduled for now or earlier
        now = datetime.utcnow()
        posts = (
            db.query(ScheduledPost)
            .filter(
                ScheduledPost.status == PostStatus.SCHEDULED, ScheduledPost.scheduled_for <= now
            )
            .all()
        )

        if not posts:
            logger.info("No scheduled posts to publish")
            return {"status": "success", "posts_published": 0, "message": "No posts due"}

        logger.info(f"Found {len(posts)} posts to publish")

        # Queue each post for publishing
        for post in posts:
            try:
                publish_post_task.delay(str(post.id))
                logger.info(f"Queued post {post.id} for publishing")
            except Exception as e:
                logger.error(f"Failed to queue post {post.id}: {e}")

        return {
            "status": "success",
            "posts_queued": len(posts),
            "message": f"Queued {len(posts)} posts for publishing",
        }

    except Exception as e:
        logger.error(f"Error in publish_scheduled_posts: {e}")
        return {"status": "error", "error": str(e)}
