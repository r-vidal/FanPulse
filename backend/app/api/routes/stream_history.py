from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.artist import Artist
from app.models.stream_history import StreamHistory
from app.models.platform import PlatformConnection, PlatformType
from app.services.platforms.spotify import SpotifyService
from pydantic import BaseModel
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class StreamHistoryResponse(BaseModel):
    id: str
    artist_id: str
    timestamp: datetime
    total_streams: int
    followers: int
    monthly_listeners: int
    popularity: int

    class Config:
        from_attributes = True


@router.post("/capture/{artist_id}", response_model=StreamHistoryResponse, status_code=status.HTTP_201_CREATED)
async def capture_stream_snapshot(
    artist_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Capture a snapshot of streaming stats for an artist

    This creates a historical data point that can be used for:
    - Momentum calculation
    - Trend analysis
    - Revenue forecasting
    - Growth tracking
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

    if not artist.spotify_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Artist does not have Spotify connection"
        )

    # Get platform connection for this artist
    platform_connection = db.query(PlatformConnection).filter(
        PlatformConnection.artist_id == artist_id,
        PlatformConnection.platform_type == PlatformType.SPOTIFY
    ).first()

    if not platform_connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spotify platform connection not found"
        )

    # Fetch current stats from Spotify
    spotify = SpotifyService()
    try:
        access_token = await spotify.get_client_credentials_token()
        stats = await spotify.get_streaming_stats(
            platform_artist_id=artist.spotify_id,
            access_token=access_token
        )

        # Create stream history record
        snapshot = StreamHistory(
            artist_id=artist_id,
            platform_connection_id=platform_connection.id,
            timestamp=datetime.utcnow(),
            total_streams=0,  # Not available via public API
            daily_streams=0,
            monthly_streams=0,
            total_listeners=0,
            monthly_listeners=stats.get('monthly_listeners', 0),
            daily_listeners=0,
            followers=stats.get('followers', 0),
            followers_change=0,  # Will be calculated on next snapshot
            saves=0,
            playlist_adds=0,
            skip_rate=None,
            completion_rate=None,
            top_countries=None,
            demographics=None,
            top_tracks=stats.get('top_tracks', [])[:10],
            raw_data={
                'popularity': stats.get('popularity', 0),
                'genres': stats.get('genres', []),
                'snapshot_type': 'manual',
                'api_version': 'v1'
            }
        )

        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)

        logger.info(f"Stream snapshot captured for artist {artist_id}")

        return StreamHistoryResponse(
            id=str(snapshot.id),
            artist_id=str(snapshot.artist_id),
            timestamp=snapshot.timestamp,
            total_streams=snapshot.total_streams,
            followers=snapshot.followers,
            monthly_listeners=snapshot.monthly_listeners,
            popularity=snapshot.raw_data.get('popularity', 0)
        )

    except Exception as e:
        logger.error(f"Failed to capture snapshot: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to capture stream snapshot: {str(e)}"
        )
    finally:
        await spotify.close()


@router.get("/history/{artist_id}", response_model=List[StreamHistoryResponse])
async def get_stream_history(
    artist_id: UUID,
    limit: int = 90,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get historical stream data for an artist

    Returns last N days of data (default 90 days)
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

    # Get history ordered by timestamp desc
    history = db.query(StreamHistory).filter(
        StreamHistory.artist_id == artist_id
    ).order_by(
        StreamHistory.timestamp.desc()
    ).limit(limit).all()

    return [
        StreamHistoryResponse(
            id=str(record.id),
            artist_id=str(record.artist_id),
            timestamp=record.timestamp,
            total_streams=record.total_streams,
            followers=record.followers,
            monthly_listeners=record.monthly_listeners,
            popularity=record.raw_data.get('popularity', 0) if record.raw_data else 0
        )
        for record in history
    ]


@router.post("/capture-all", status_code=status.HTTP_202_ACCEPTED)
async def capture_all_artists(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Capture stream snapshots for all user's artists

    This is useful for daily batch updates
    Returns count of snapshots captured
    """
    artists = db.query(Artist).filter(
        Artist.user_id == current_user.id,
        Artist.spotify_id.isnot(None)
    ).all()

    captured_count = 0
    errors = []

    spotify = SpotifyService()
    try:
        access_token = await spotify.get_client_credentials_token()

        for artist in artists:
            try:
                # Get platform connection
                platform_connection = db.query(PlatformConnection).filter(
                    PlatformConnection.artist_id == artist.id,
                    PlatformConnection.platform_type == PlatformType.SPOTIFY
                ).first()

                if not platform_connection:
                    errors.append(f"No Spotify connection for {artist.name}")
                    continue

                # Fetch stats
                stats = await spotify.get_streaming_stats(
                    platform_artist_id=artist.spotify_id,
                    access_token=access_token
                )

                # Create snapshot
                snapshot = StreamHistory(
                    artist_id=artist.id,
                    platform_connection_id=platform_connection.id,
                    timestamp=datetime.utcnow(),
                    total_streams=0,
                    daily_streams=0,
                    monthly_streams=0,
                    total_listeners=0,
                    monthly_listeners=stats.get('monthly_listeners', 0),
                    daily_listeners=0,
                    followers=stats.get('followers', 0),
                    followers_change=0,
                    saves=0,
                    playlist_adds=0,
                    top_tracks=stats.get('top_tracks', [])[:10],
                    raw_data={
                        'popularity': stats.get('popularity', 0),
                        'genres': stats.get('genres', []),
                        'snapshot_type': 'batch',
                        'api_version': 'v1'
                    }
                )

                db.add(snapshot)
                captured_count += 1

            except Exception as e:
                errors.append(f"Failed for {artist.name}: {str(e)}")
                logger.error(f"Failed to capture snapshot for {artist.id}: {str(e)}")

        db.commit()

    finally:
        await spotify.close()

    return {
        "message": "Batch capture completed",
        "captured": captured_count,
        "total_artists": len(artists),
        "errors": errors if errors else None
    }
