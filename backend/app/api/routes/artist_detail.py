from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta
from uuid import UUID
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.artist import Artist
from app.models.momentum import MomentumScore
from app.models.superfan import Superfan
from app.models.action import NextBestAction, ActionStatus
from app.models.alert import Alert
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class ArtistStats(BaseModel):
    """Aggregated statistics for a specific artist"""
    artist_id: str
    artist_name: str
    artist_image: Optional[str]
    artist_genre: Optional[str]

    # Current metrics
    current_momentum: float
    momentum_status: str
    total_superfans: int
    total_streams: int
    pending_actions: int
    critical_actions: int
    recent_alerts: int

    # Trends
    momentum_trend_7d: Optional[float]
    momentum_trend_30d: Optional[float]


class MomentumDataPoint(BaseModel):
    """Single data point for momentum chart"""
    date: datetime
    score: float
    category: str


@router.get("/{artist_id}/stats", response_model=ArtistStats)
async def get_artist_stats(
    artist_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get aggregated statistics for a specific artist"""

    try:
        artist_uuid = UUID(artist_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid artist ID")

    # Get artist and verify ownership
    artist = db.query(Artist).filter(
        Artist.id == artist_uuid,
        Artist.user_id == current_user.id
    ).first()

    if not artist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found")

    # Current momentum
    current_momentum = 0.0
    momentum_status = 'unknown'
    momentum_trend_7d = None
    momentum_trend_30d = None

    try:
        latest_momentum = db.query(MomentumScore).filter(
            MomentumScore.artist_id == artist_uuid
        ).order_by(desc(MomentumScore.calculated_at)).first()

        if latest_momentum:
            current_momentum = latest_momentum.overall_score
            momentum_status = latest_momentum.momentum_category or 'steady'

            # Calculate trends
            momentum_7d_ago = db.query(MomentumScore).filter(
                MomentumScore.artist_id == artist_uuid,
                MomentumScore.calculated_at <= datetime.utcnow() - timedelta(days=7)
            ).order_by(desc(MomentumScore.calculated_at)).first()

            if momentum_7d_ago:
                momentum_trend_7d = ((current_momentum - momentum_7d_ago.overall_score) / momentum_7d_ago.overall_score) * 100

            momentum_30d_ago = db.query(MomentumScore).filter(
                MomentumScore.artist_id == artist_uuid,
                MomentumScore.calculated_at <= datetime.utcnow() - timedelta(days=30)
            ).order_by(desc(MomentumScore.calculated_at)).first()

            if momentum_30d_ago:
                momentum_trend_30d = ((current_momentum - momentum_30d_ago.overall_score) / momentum_30d_ago.overall_score) * 100
    except Exception as e:
        logger.warning(f"Could not query momentum for artist {artist_id}: {e}")

    # Total superfans
    total_superfans = 0
    try:
        total_superfans = db.query(func.count(Superfan.id)).filter(
            Superfan.artist_id == artist_uuid
        ).scalar() or 0
    except Exception as e:
        logger.warning(f"Could not count superfans: {e}")

    # Total streams (from latest momentum if available)
    total_streams = 0
    try:
        if latest_momentum and hasattr(latest_momentum, 'key_insights'):
            insights = latest_momentum.key_insights
            if isinstance(insights, dict) and 'total_streams' in insights:
                total_streams = int(insights.get('total_streams', 0))
    except Exception as e:
        logger.warning(f"Could not get stream count: {e}")

    # Pending actions
    pending_actions = 0
    critical_actions = 0
    try:
        pending_actions = db.query(func.count(NextBestAction.id)).filter(
            NextBestAction.artist_id == artist_uuid,
            NextBestAction.status == ActionStatus.PENDING
        ).scalar() or 0

        critical_actions = db.query(func.count(NextBestAction.id)).filter(
            NextBestAction.artist_id == artist_uuid,
            NextBestAction.status == ActionStatus.PENDING,
            NextBestAction.urgency == 'critical'
        ).scalar() or 0
    except Exception as e:
        logger.warning(f"Could not count actions: {e}")

    # Recent alerts
    recent_alerts = 0
    try:
        recent_alerts = db.query(func.count(Alert.id)).filter(
            Alert.artist_id == artist_uuid,
            Alert.created_at >= datetime.utcnow() - timedelta(days=7)
        ).scalar() or 0
    except Exception as e:
        logger.warning(f"Could not count alerts: {e}")

    return ArtistStats(
        artist_id=str(artist.id),
        artist_name=artist.name,
        artist_image=artist.image_url,
        artist_genre=artist.genre,
        current_momentum=current_momentum,
        momentum_status=momentum_status,
        total_superfans=total_superfans,
        total_streams=total_streams,
        pending_actions=pending_actions,
        critical_actions=critical_actions,
        recent_alerts=recent_alerts,
        momentum_trend_7d=momentum_trend_7d,
        momentum_trend_30d=momentum_trend_30d
    )


@router.get("/{artist_id}/momentum-history", response_model=List[MomentumDataPoint])
async def get_momentum_history(
    artist_id: str,
    days: int = 90,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get momentum score history for charting (last N days)"""

    try:
        artist_uuid = UUID(artist_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid artist ID")

    # Verify artist ownership
    artist = db.query(Artist).filter(
        Artist.id == artist_uuid,
        Artist.user_id == current_user.id
    ).first()

    if not artist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found")

    # Get momentum history
    data_points = []
    try:
        momentum_records = db.query(MomentumScore).filter(
            MomentumScore.artist_id == artist_uuid,
            MomentumScore.calculated_at >= datetime.utcnow() - timedelta(days=days)
        ).order_by(MomentumScore.calculated_at.asc()).all()

        for record in momentum_records:
            data_points.append(MomentumDataPoint(
                date=record.calculated_at,
                score=record.overall_score,
                category=record.momentum_category or 'steady'
            ))
    except Exception as e:
        logger.warning(f"Could not query momentum history: {e}")

    return data_points
