"""Platform connection API routes"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import List, Optional
import secrets

from app.core.database import get_db
from app.models.user import User
from app.models.artist import Artist
from app.models.platform import PlatformConnection, PlatformType
from app.models.stream_history import StreamHistory
from app.api.deps import get_current_user
from app.services.platforms.spotify import SpotifyService
from app.services.platforms.apple_music import AppleMusicService
from app.services.platforms.instagram import InstagramService
from app.services.platforms.tiktok import TikTokService
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/platforms", tags=["platforms"])


# Pydantic schemas
class PlatformAuthURLResponse(BaseModel):
    authorization_url: str
    state: str


class PlatformCallbackRequest(BaseModel):
    code: str
    state: str
    artist_id: str
    platform_artist_id: Optional[str] = None


class PlatformConnectionResponse(BaseModel):
    id: str
    artist_id: str
    platform_type: str
    platform_artist_id: str
    platform_username: Optional[str]
    is_active: bool
    last_synced_at: Optional[datetime]
    connected_at: datetime

    class Config:
        from_attributes = True


class StreamStatsResponse(BaseModel):
    timestamp: datetime
    total_streams: Optional[int] = 0
    monthly_listeners: Optional[int] = 0
    followers: Optional[int] = 0
    raw_data: dict


# Helper function to get platform service
def get_platform_service(platform_type: PlatformType):
    """Factory function to get the appropriate platform service"""
    services = {
        PlatformType.SPOTIFY: SpotifyService,
        PlatformType.APPLE_MUSIC: AppleMusicService,
        PlatformType.INSTAGRAM: InstagramService,
        PlatformType.TIKTOK: TikTokService,
    }

    service_class = services.get(platform_type)
    if not service_class:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Platform {platform_type} not supported",
        )

    return service_class()


@router.get("/auth-url/{platform_type}", response_model=PlatformAuthURLResponse)
async def get_platform_auth_url(
    platform_type: PlatformType,
    current_user: User = Depends(get_current_user),
):
    """
    Get OAuth authorization URL for a platform

    Returns the URL to redirect users to for platform authorization
    """
    service = get_platform_service(platform_type)

    # Generate state token for CSRF protection
    state = secrets.token_urlsafe(32)

    try:
        auth_url = await service.get_authorization_url(state)
        return PlatformAuthURLResponse(
            authorization_url=auth_url,
            state=state,
        )
    except Exception as e:
        logger.error(f"Failed to generate auth URL for {platform_type}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate authorization URL: {str(e)}",
        )


@router.post("/callback", response_model=PlatformConnectionResponse)
async def handle_platform_callback(
    callback_data: PlatformCallbackRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Handle OAuth callback from platform

    Exchanges authorization code for access token and creates platform connection
    """
    # Verify artist belongs to user
    result = await db.execute(
        select(Artist).where(
            Artist.id == callback_data.artist_id,
            Artist.user_id == current_user.id,
        )
    )
    artist = result.scalar_one_or_none()

    if not artist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found",
        )

    # Determine platform type from existing connection or use Spotify as default
    # In production, you'd pass platform_type in the callback
    # For now, we'll check if connection already exists
    existing_conn = await db.execute(
        select(PlatformConnection).where(
            PlatformConnection.artist_id == callback_data.artist_id,
        )
    )
    existing = existing_conn.scalars().first()

    # You should pass platform_type in callback_data in production
    # This is a simplified version
    platform_type = PlatformType.SPOTIFY  # Default, should be passed

    service = get_platform_service(platform_type)

    try:
        # Exchange code for tokens
        token_data = await service.exchange_code_for_token(callback_data.code)

        # Create or update platform connection
        result = await db.execute(
            select(PlatformConnection).where(
                PlatformConnection.artist_id == callback_data.artist_id,
                PlatformConnection.platform_type == platform_type,
            )
        )
        connection = result.scalar_one_or_none()

        if connection:
            # Update existing connection
            connection.access_token = token_data["access_token"]
            connection.refresh_token = token_data.get("refresh_token")
            connection.token_expires_at = service.get_token_expiry(token_data["expires_in"])
            connection.is_active = True
            connection.last_synced_at = datetime.utcnow()
        else:
            # Create new connection
            connection = PlatformConnection(
                artist_id=callback_data.artist_id,
                platform_type=platform_type,
                platform_artist_id=callback_data.platform_artist_id or token_data.get("user_id", ""),
                access_token=token_data["access_token"],
                refresh_token=token_data.get("refresh_token"),
                token_expires_at=service.get_token_expiry(token_data["expires_in"]),
                is_active=True,
            )
            db.add(connection)

        await db.commit()
        await db.refresh(connection)

        return PlatformConnectionResponse(
            id=str(connection.id),
            artist_id=str(connection.artist_id),
            platform_type=connection.platform_type.value,
            platform_artist_id=connection.platform_artist_id,
            platform_username=connection.platform_username,
            is_active=connection.is_active,
            last_synced_at=connection.last_synced_at,
            connected_at=connection.connected_at,
        )

    except Exception as e:
        logger.error(f"Failed to connect platform {platform_type}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect platform: {str(e)}",
        )
    finally:
        await service.close()


@router.get("/connections", response_model=List[PlatformConnectionResponse])
async def get_platform_connections(
    artist_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all platform connections for user's artists

    Optionally filter by artist_id
    """
    query = select(PlatformConnection).join(Artist).where(Artist.user_id == current_user.id)

    if artist_id:
        query = query.where(PlatformConnection.artist_id == artist_id)

    result = await db.execute(query)
    connections = result.scalars().all()

    return [
        PlatformConnectionResponse(
            id=str(conn.id),
            artist_id=str(conn.artist_id),
            platform_type=conn.platform_type.value,
            platform_artist_id=conn.platform_artist_id,
            platform_username=conn.platform_username,
            is_active=conn.is_active,
            last_synced_at=conn.last_synced_at,
            connected_at=conn.connected_at,
        )
        for conn in connections
    ]


@router.delete("/connections/{connection_id}")
async def disconnect_platform(
    connection_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Disconnect a platform connection
    """
    result = await db.execute(
        select(PlatformConnection)
        .join(Artist)
        .where(
            PlatformConnection.id == connection_id,
            Artist.user_id == current_user.id,
        )
    )
    connection = result.scalar_one_or_none()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Platform connection not found",
        )

    await db.delete(connection)
    await db.commit()

    return {"message": "Platform disconnected successfully"}


@router.post("/connections/{connection_id}/sync", response_model=StreamStatsResponse)
async def sync_platform_data(
    connection_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Manually trigger data sync for a platform connection

    Fetches latest data from the platform and stores it in the database
    """
    # Get connection
    result = await db.execute(
        select(PlatformConnection)
        .join(Artist)
        .where(
            PlatformConnection.id == connection_id,
            Artist.user_id == current_user.id,
        )
    )
    connection = result.scalar_one_or_none()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Platform connection not found",
        )

    service = get_platform_service(connection.platform_type)

    try:
        # Check if token needs refresh
        if service.is_token_expired(connection.token_expires_at):
            if connection.refresh_token:
                token_data = await service.refresh_access_token(connection.refresh_token)
                connection.access_token = token_data["access_token"]
                connection.token_expires_at = service.get_token_expiry(token_data["expires_in"])
                await db.commit()
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token expired and no refresh token available. Please reconnect.",
                )

        # Fetch streaming stats
        stats = await service.get_streaming_stats(
            connection.platform_artist_id,
            connection.access_token,
        )

        # Create stream history entry
        stream_history = StreamHistory(
            artist_id=connection.artist_id,
            platform_connection_id=connection.id,
            timestamp=datetime.utcnow(),
            total_streams=stats.get("total_streams", 0),
            monthly_listeners=stats.get("monthly_listeners", 0),
            followers=stats.get("followers", 0),
            raw_data=stats.get("raw_data", {}),
        )
        db.add(stream_history)

        # Update connection
        connection.last_synced_at = datetime.utcnow()
        connection.sync_error = None

        await db.commit()

        return StreamStatsResponse(
            timestamp=stream_history.timestamp,
            total_streams=stream_history.total_streams,
            monthly_listeners=stream_history.monthly_listeners,
            followers=stream_history.followers,
            raw_data=stream_history.raw_data,
        )

    except Exception as e:
        logger.error(f"Failed to sync platform data: {e}")
        connection.sync_error = str(e)
        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync data: {str(e)}",
        )
    finally:
        await service.close()


@router.get("/connections/{connection_id}/history", response_model=List[StreamStatsResponse])
async def get_platform_history(
    connection_id: str,
    limit: int = Query(30, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get historical streaming data for a platform connection
    """
    # Verify access
    result = await db.execute(
        select(PlatformConnection)
        .join(Artist)
        .where(
            PlatformConnection.id == connection_id,
            Artist.user_id == current_user.id,
        )
    )
    connection = result.scalar_one_or_none()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Platform connection not found",
        )

    # Get history
    result = await db.execute(
        select(StreamHistory)
        .where(StreamHistory.platform_connection_id == connection_id)
        .order_by(StreamHistory.timestamp.desc())
        .limit(limit)
    )
    history = result.scalars().all()

    return [
        StreamStatsResponse(
            timestamp=entry.timestamp,
            total_streams=entry.total_streams,
            monthly_listeners=entry.monthly_listeners,
            followers=entry.followers,
            raw_data=entry.raw_data or {},
        )
        for entry in history
    ]
