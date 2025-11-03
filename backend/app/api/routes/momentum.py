from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.artist import Artist
from app.services.platforms.spotify import SpotifyService
from app.services.momentum import MomentumCalculator
from pydantic import BaseModel
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class MomentumResponse(BaseModel):
    score: float
    status: str
    signals: Dict[str, float]
    trend_7d: Optional[float]
    trend_30d: Optional[float]
    data_points: Dict[str, int]


@router.get("/{artist_id}", response_model=MomentumResponse)
async def get_momentum(
    artist_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get momentum score for an artist

    Returns:
    - score: 0-10 momentum score
    - status: fire/growing/stable/declining
    - signals: breakdown by component
    - trend_7d: 7-day trend %
    - trend_30d: 30-day trend %
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

    # Fetch current stats from Spotify
    spotify = SpotifyService()
    try:
        access_token = await spotify.get_client_credentials_token()
        current_stats = await spotify.get_streaming_stats(
            platform_artist_id=artist.spotify_id,
            access_token=access_token
        )

        # Calculate momentum
        calculator = MomentumCalculator(db)
        momentum = calculator.calculate_momentum(
            artist_id=str(artist_id),
            current_stats=current_stats
        )

        return momentum

    except Exception as e:
        logger.error(f"Failed to calculate momentum: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate momentum: {str(e)}"
        )
    finally:
        await spotify.close()
