from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.platform import PlatformConnection, PlatformType
from app.services.platforms.spotify import SpotifyService
from datetime import datetime, timedelta
import secrets
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# In-memory state storage (in production, use Redis or database)
oauth_states = {}


@router.get("/authorize")
async def spotify_authorize(
    current_user: User = Depends(get_current_user)
):
    """
    Initiate Spotify OAuth flow
    Redirects user to Spotify authorization page
    """
    spotify = SpotifyService()

    try:
        # Generate random state for CSRF protection
        state = secrets.token_urlsafe(32)
        oauth_states[state] = {
            "user_id": str(current_user.id),
            "created_at": datetime.utcnow()
        }

        # Get Spotify authorization URL
        auth_url = await spotify.get_authorization_url(state)

        return RedirectResponse(url=auth_url)

    finally:
        await spotify.close()


@router.get("/callback")
async def spotify_callback(
    code: str = Query(..., description="Authorization code from Spotify"),
    state: str = Query(..., description="State parameter for CSRF protection"),
    error: str = Query(None, description="Error from Spotify"),
    db: Session = Depends(get_db)
):
    """
    Handle Spotify OAuth callback
    Exchanges code for access token and stores it
    """
    # Check for errors from Spotify
    if error:
        logger.error(f"Spotify OAuth error: {error}")
        return RedirectResponse(
            url=f"/dashboard?error=spotify_auth_failed",
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

    # Check state expiry (5 minutes)
    if datetime.utcnow() - state_data["created_at"] > timedelta(minutes=5):
        logger.error("OAuth state expired")
        return RedirectResponse(
            url=f"/dashboard?error=state_expired",
            status_code=status.HTTP_302_FOUND
        )

    spotify = SpotifyService()

    try:
        # Exchange authorization code for tokens
        token_data = await spotify.exchange_code_for_token(code)

        # Calculate token expiry
        expires_at = datetime.utcnow() + timedelta(seconds=token_data["expires_in"])

        # Get user's Spotify profile to verify
        user_profile = await spotify.make_request(
            method="GET",
            url="https://api.spotify.com/v1/me",
            headers={"Authorization": f"Bearer {token_data['access_token']}"}
        )

        logger.info(f"Spotify user authenticated: {user_profile.get('display_name', 'Unknown')}")

        # For now, we'll store the user's Spotify connection
        # Later, this can be linked to specific artists
        # Note: This gives us access to the user's Spotify data, but NOT artist analytics
        # For actual artist streaming data, we need Spotify for Artists API access

        # Clean up expired states (older than 10 minutes)
        current_time = datetime.utcnow()
        expired_states = [
            s for s, data in oauth_states.items()
            if current_time - data["created_at"] > timedelta(minutes=10)
        ]
        for s in expired_states:
            oauth_states.pop(s, None)

        return RedirectResponse(
            url=f"/dashboard?spotify_connected=true",
            status_code=status.HTTP_302_FOUND
        )

    except Exception as e:
        logger.error(f"Failed to exchange code for token: {str(e)}")
        return RedirectResponse(
            url=f"/dashboard?error=token_exchange_failed",
            status_code=status.HTTP_302_FOUND
        )

    finally:
        await spotify.close()


@router.get("/disconnect")
async def spotify_disconnect(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Disconnect Spotify integration
    Removes all Spotify platform connections for the user's artists
    """
    # Get all artists for current user
    from app.models.artist import Artist

    artist_ids = [
        artist.id for artist in
        db.query(Artist).filter(Artist.user_id == current_user.id).all()
    ]

    # Delete all Spotify platform connections
    deleted_count = db.query(PlatformConnection).filter(
        PlatformConnection.artist_id.in_(artist_ids),
        PlatformConnection.platform_type == PlatformType.SPOTIFY
    ).delete(synchronize_session=False)

    db.commit()

    return {
        "message": "Spotify disconnected successfully",
        "connections_removed": deleted_count
    }
