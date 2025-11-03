from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.artist import Artist
from app.models.platform import PlatformConnection, PlatformType
from app.services.platforms.instagram import InstagramService
from datetime import datetime, timedelta
import secrets
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory state storage (in production, use Redis or database)
oauth_states = {}


@router.get("/authorize")
async def instagram_authorize(
    artist_id: str = Query(..., description="Artist ID to connect"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initiate Instagram OAuth flow for an artist
    Redirects user to Instagram authorization page
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

    instagram = InstagramService()

    try:
        # Generate random state for CSRF protection
        state = secrets.token_urlsafe(32)
        oauth_states[state] = {
            "user_id": str(current_user.id),
            "artist_id": artist_id,
            "created_at": datetime.utcnow()
        }

        # Get Instagram authorization URL
        auth_url = await instagram.get_authorization_url(state)

        return RedirectResponse(url=auth_url)

    finally:
        await instagram.close()


@router.get("/callback")
async def instagram_callback(
    code: str = Query(..., description="Authorization code from Instagram"),
    state: str = Query(..., description="State parameter for CSRF protection"),
    error: str = Query(None, description="Error from Instagram"),
    db: Session = Depends(get_db)
):
    """
    Handle Instagram OAuth callback
    Exchanges code for access token and stores it
    """
    # Check for errors from Instagram
    if error:
        logger.error(f"Instagram OAuth error: {error}")
        return RedirectResponse(
            url=f"/dashboard?error=instagram_auth_failed",
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

    instagram = InstagramService()

    try:
        # Exchange authorization code for tokens
        token_data = await instagram.exchange_code_for_token(code)

        # Calculate token expiry
        expires_at = datetime.utcnow() + timedelta(seconds=token_data.get("expires_in", 5184000))

        # Get Instagram profile data
        user_profile = await instagram.get_profile_data(
            user_id=token_data["user_id"],
            access_token=token_data["access_token"]
        )

        username = user_profile.get("username")
        logger.info(f"Instagram user authenticated: {username}")

        # Check if platform connection already exists
        existing_connection = db.query(PlatformConnection).filter(
            PlatformConnection.artist_id == artist_id,
            PlatformConnection.platform_type == PlatformType.INSTAGRAM
        ).first()

        if existing_connection:
            # Update existing connection
            existing_connection.access_token = token_data["access_token"]
            existing_connection.refresh_token = token_data.get("refresh_token")
            existing_connection.token_expires_at = expires_at
            existing_connection.platform_username = username
            existing_connection.platform_artist_id = token_data["user_id"]
            existing_connection.is_active = True
            existing_connection.last_synced_at = datetime.utcnow()
            existing_connection.platform_data = {
                "followers_count": user_profile.get("followers_count", 0),
                "follows_count": user_profile.get("follows_count", 0),
                "media_count": user_profile.get("media_count", 0),
                "profile_picture_url": user_profile.get("profile_picture_url"),
            }
        else:
            # Create new platform connection
            platform_connection = PlatformConnection(
                artist_id=artist_id,
                platform_type=PlatformType.INSTAGRAM,
                platform_artist_id=token_data["user_id"],
                platform_username=username,
                access_token=token_data["access_token"],
                refresh_token=token_data.get("refresh_token"),
                token_expires_at=expires_at,
                is_active=True,
                last_synced_at=datetime.utcnow(),
                platform_data={
                    "followers_count": user_profile.get("followers_count", 0),
                    "follows_count": user_profile.get("follows_count", 0),
                    "media_count": user_profile.get("media_count", 0),
                    "profile_picture_url": user_profile.get("profile_picture_url"),
                }
            )
            db.add(platform_connection)

        # Update artist instagram_id
        if not artist.instagram_id:
            artist.instagram_id = username

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
            url=f"/dashboard/artists/{artist_id}?instagram_connected=true",
            status_code=status.HTTP_302_FOUND
        )

    except Exception as e:
        logger.error(f"Failed to connect Instagram: {str(e)}")
        return RedirectResponse(
            url=f"/dashboard/artists/{artist_id}?error=instagram_connection_failed",
            status_code=status.HTTP_302_FOUND
        )

    finally:
        await instagram.close()


@router.get("/disconnect/{artist_id}")
async def instagram_disconnect(
    artist_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Disconnect Instagram integration for an artist
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

    # Delete Instagram platform connection
    deleted_count = db.query(PlatformConnection).filter(
        PlatformConnection.artist_id == artist_id,
        PlatformConnection.platform_type == PlatformType.INSTAGRAM
    ).delete(synchronize_session=False)

    db.commit()

    return {
        "message": "Instagram disconnected successfully",
        "artist_id": artist_id,
        "deleted": deleted_count > 0
    }
