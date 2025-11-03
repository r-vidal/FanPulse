from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.artist import Artist
from app.models.platform import PlatformConnection, PlatformType
from app.services.platforms.tiktok import TikTokService
from datetime import datetime, timedelta
import secrets
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory state storage (in production, use Redis or database)
oauth_states = {}


@router.get("/authorize")
async def tiktok_authorize(
    artist_id: str = Query(..., description="Artist ID to connect"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initiate TikTok OAuth flow for an artist
    Redirects user to TikTok authorization page
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

    tiktok = TikTokService()

    try:
        # Generate random state for CSRF protection
        state = secrets.token_urlsafe(32)
        oauth_states[state] = {
            "user_id": str(current_user.id),
            "artist_id": artist_id,
            "created_at": datetime.utcnow()
        }

        # Get TikTok authorization URL
        auth_url = await tiktok.get_authorization_url(state)

        return RedirectResponse(url=auth_url)

    finally:
        await tiktok.close()


@router.get("/callback")
async def tiktok_callback(
    code: str = Query(..., description="Authorization code from TikTok"),
    state: str = Query(..., description="State parameter for CSRF protection"),
    error: str = Query(None, description="Error from TikTok"),
    db: Session = Depends(get_db)
):
    """
    Handle TikTok OAuth callback
    Exchanges code for access token and stores it
    """
    # Check for errors from TikTok
    if error:
        logger.error(f"TikTok OAuth error: {error}")
        return RedirectResponse(
            url=f"/dashboard?error=tiktok_auth_failed",
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

    tiktok = TikTokService()

    try:
        # Exchange authorization code for tokens
        token_data = await tiktok.exchange_code_for_token(code)

        # Calculate token expiry
        expires_at = datetime.utcnow() + timedelta(seconds=token_data.get("expires_in", 86400))

        # Get TikTok profile data
        user_profile = await tiktok.get_artist_data(
            platform_artist_id=token_data["open_id"],
            access_token=token_data["access_token"]
        )

        username = user_profile.get("username") or user_profile.get("display_name")
        logger.info(f"TikTok user authenticated: {username}")

        # Check if platform connection already exists
        existing_connection = db.query(PlatformConnection).filter(
            PlatformConnection.artist_id == artist_id,
            PlatformConnection.platform_type == PlatformType.TIKTOK
        ).first()

        if existing_connection:
            # Update existing connection
            existing_connection.access_token = token_data["access_token"]
            existing_connection.refresh_token = token_data.get("refresh_token")
            existing_connection.token_expires_at = expires_at
            existing_connection.platform_username = username
            existing_connection.platform_artist_id = token_data["open_id"]
            existing_connection.is_active = True
            existing_connection.last_synced_at = datetime.utcnow()
            existing_connection.platform_data = {
                "union_id": user_profile.get("union_id"),
                "display_name": user_profile.get("display_name"),
                "followers": user_profile.get("followers", 0),
                "following": user_profile.get("following", 0),
                "likes": user_profile.get("likes", 0),
                "video_count": user_profile.get("video_count", 0),
                "is_verified": user_profile.get("is_verified", False),
                "avatar_url": user_profile.get("avatar_url"),
                "bio": user_profile.get("bio"),
            }
        else:
            # Create new platform connection
            platform_connection = PlatformConnection(
                artist_id=artist_id,
                platform_type=PlatformType.TIKTOK,
                platform_artist_id=token_data["open_id"],
                platform_username=username,
                access_token=token_data["access_token"],
                refresh_token=token_data.get("refresh_token"),
                token_expires_at=expires_at,
                is_active=True,
                last_synced_at=datetime.utcnow(),
                platform_data={
                    "union_id": user_profile.get("union_id"),
                    "display_name": user_profile.get("display_name"),
                    "followers": user_profile.get("followers", 0),
                    "following": user_profile.get("following", 0),
                    "likes": user_profile.get("likes", 0),
                    "video_count": user_profile.get("video_count", 0),
                    "is_verified": user_profile.get("is_verified", False),
                    "avatar_url": user_profile.get("avatar_url"),
                    "bio": user_profile.get("bio"),
                }
            )
            db.add(platform_connection)

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
            url=f"/dashboard/artists/{artist_id}?tiktok_connected=true",
            status_code=status.HTTP_302_FOUND
        )

    except Exception as e:
        logger.error(f"Failed to connect TikTok: {str(e)}")
        return RedirectResponse(
            url=f"/dashboard/artists/{artist_id}?error=tiktok_connection_failed",
            status_code=status.HTTP_302_FOUND
        )

    finally:
        await tiktok.close()


@router.get("/disconnect/{artist_id}")
async def tiktok_disconnect(
    artist_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Disconnect TikTok integration for an artist
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

    # Delete TikTok platform connection
    deleted_count = db.query(PlatformConnection).filter(
        PlatformConnection.artist_id == artist_id,
        PlatformConnection.platform_type == PlatformType.TIKTOK
    ).delete(synchronize_session=False)

    db.commit()

    return {
        "message": "TikTok disconnected successfully",
        "artist_id": artist_id,
        "deleted": deleted_count > 0
    }
