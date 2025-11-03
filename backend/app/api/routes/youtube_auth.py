from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.artist import Artist
from app.models.platform import PlatformConnection, PlatformType
from app.services.platforms.youtube import YouTubeService
from datetime import datetime, timedelta
import secrets
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory state storage (in production, use Redis or database)
oauth_states = {}


@router.get("/authorize")
async def youtube_authorize(
    artist_id: str = Query(..., description="Artist ID to connect"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initiate YouTube OAuth flow for an artist
    Redirects user to Google authorization page
    """
    # Verify artist belongs to user
    artist = db.query(Artist).filter(
        Artist.id == artist_id,
        Artist.user_id == current_user.id
    ).first()

    if not artist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

    youtube = YouTubeService()

    try:
        # Generate random state for CSRF protection
        state = secrets.token_urlsafe(32)
        oauth_states[state] = {
            "user_id": str(current_user.id),
            "artist_id": artist_id,
            "created_at": datetime.utcnow()
        }

        # Get YouTube authorization URL
        auth_url = await youtube.get_authorization_url(state)

        return RedirectResponse(url=auth_url)

    finally:
        await youtube.close()


@router.get("/callback")
async def youtube_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: str = Query(..., description="State parameter for CSRF protection"),
    error: str = Query(None, description="Error from Google"),
    db: Session = Depends(get_db)
):
    """
    Handle YouTube OAuth callback
    Exchanges code for access token and stores it
    """
    # Check for errors from Google
    if error:
        logger.error(f"YouTube OAuth error: {error}")
        return RedirectResponse(
            url=f"/dashboard?error=youtube_auth_failed",
            status_code=status.HTTP_302_FOUND
        )

    # Verify state to prevent CSRF
    if state not in oauth_states:
        logger.error("Invalid OAuth state")
        return RedirectResponse(
            url=f"/dashboard?error=invalid_state",
            status_code=status.HTTP_302_FOUND
        )

    state_data = oauth_states.pop(state)
    user_id = state_data["user_id"]
    artist_id = state_data["artist_id"]

    # Check state expiry (5 minutes)
    if datetime.utcnow() - state_data["created_at"] > timedelta(minutes=5):
        logger.error("OAuth state expired")
        return RedirectResponse(
            url=f"/dashboard?error=state_expired",
            status_code=status.HTTP_302_FOUND
        )

    # Get artist
    artist = db.query(Artist).filter(Artist.id == artist_id).first()
    if not artist:
        return RedirectResponse(
            url=f"/dashboard?error=artist_not_found",
            status_code=status.HTTP_302_FOUND
        )

    youtube = YouTubeService()

    try:
        # Exchange authorization code for tokens
        token_data = await youtube.exchange_code_for_token(code)

        if not token_data.get("refresh_token"):
            logger.warning("No refresh token received - user may have already authorized")

        # Calculate token expiry
        expires_at = datetime.utcnow() + timedelta(seconds=token_data.get("expires_in", 3600))

        # Get user's YouTube channel
        # First, try to get the channel for the authenticated user
        headers = {"Authorization": f"Bearer {token_data['access_token']}"}
        params = {
            "part": "snippet,statistics,contentDetails",
            "mine": "true",
        }

        channel_response = await youtube.make_request(
            method="GET",
            url=f"{youtube.base_url}/channels",
            headers=headers,
            params=params,
        )

        if not channel_response.get("items"):
            logger.error("No YouTube channel found for authenticated user")
            return RedirectResponse(
                url=f"/dashboard/artists/{artist_id}?error=no_youtube_channel",
                status_code=status.HTTP_302_FOUND
            )

        channel = channel_response["items"][0]
        channel_id = channel["id"]
        snippet = channel.get("snippet", {})
        statistics = channel.get("statistics", {})

        channel_title = snippet.get("title")
        logger.info(f"YouTube channel authenticated: {channel_title}")

        # Check if platform connection already exists
        existing_connection = db.query(PlatformConnection).filter(
            PlatformConnection.artist_id == artist_id,
            PlatformConnection.platform_type == PlatformType.YOUTUBE
        ).first()

        if existing_connection:
            # Update existing connection
            existing_connection.access_token = token_data["access_token"]
            existing_connection.refresh_token = token_data.get("refresh_token") or existing_connection.refresh_token
            existing_connection.token_expires_at = expires_at
            existing_connection.platform_username = snippet.get("customUrl") or channel_title
            existing_connection.platform_artist_id = channel_id
            existing_connection.is_active = True
            existing_connection.last_synced_at = datetime.utcnow()
            existing_connection.platform_data = {
                "channel_title": channel_title,
                "description": snippet.get("description"),
                "custom_url": snippet.get("customUrl"),
                "subscribers": int(statistics.get("subscriberCount", 0)),
                "total_views": int(statistics.get("viewCount", 0)),
                "video_count": int(statistics.get("videoCount", 0)),
                "thumbnail": snippet.get("thumbnails", {}).get("default", {}).get("url"),
                "country": snippet.get("country"),
            }
        else:
            # Create new platform connection
            platform_connection = PlatformConnection(
                artist_id=artist_id,
                platform_type=PlatformType.YOUTUBE,
                platform_artist_id=channel_id,
                platform_username=snippet.get("customUrl") or channel_title,
                access_token=token_data["access_token"],
                refresh_token=token_data.get("refresh_token"),
                token_expires_at=expires_at,
                is_active=True,
                last_synced_at=datetime.utcnow(),
                platform_data={
                    "channel_title": channel_title,
                    "description": snippet.get("description"),
                    "custom_url": snippet.get("customUrl"),
                    "subscribers": int(statistics.get("subscriberCount", 0)),
                    "total_views": int(statistics.get("viewCount", 0)),
                    "video_count": int(statistics.get("videoCount", 0)),
                    "thumbnail": snippet.get("thumbnails", {}).get("default", {}).get("url"),
                    "country": snippet.get("country"),
                }
            )
            db.add(platform_connection)

        # Update artist youtube_id
        if not artist.youtube_id:
            artist.youtube_id = channel_id

        db.commit()

        # Clean up expired states
        current_time = datetime.utcnow()
        expired_states = [
            s for s, data in oauth_states.items()
            if current_time - data["created_at"] > timedelta(minutes=10)
        ]
        for s in expired_states:
            oauth_states.pop(s, None)

        return RedirectResponse(
            url=f"/dashboard/artists/{artist_id}?youtube_connected=true",
            status_code=status.HTTP_302_FOUND
        )

    except Exception as e:
        logger.error(f"Failed to connect YouTube: {str(e)}")
        return RedirectResponse(
            url=f"/dashboard/artists/{artist_id}?error=youtube_connection_failed&detail={str(e)}",
            status_code=status.HTTP_302_FOUND
        )

    finally:
        await youtube.close()


@router.get("/disconnect/{artist_id}")
async def youtube_disconnect(
    artist_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Disconnect YouTube integration for an artist
    """
    # Verify artist belongs to user
    artist = db.query(Artist).filter(
        Artist.id == artist_id,
        Artist.user_id == current_user.id
    ).first()

    if not artist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

    # Delete YouTube platform connection
    deleted_count = db.query(PlatformConnection).filter(
        PlatformConnection.artist_id == artist_id,
        PlatformConnection.platform_type == PlatformType.YOUTUBE
    ).delete(synchronize_session=False)

    db.commit()

    return {
        "message": "YouTube disconnected successfully",
        "artist_id": artist_id,
        "deleted": deleted_count > 0
    }
