from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.artist import Artist
from app.models.momentum import MomentumScore
from app.models.superfan import Superfan
from app.models.action import NextBestAction, ActionStatus
from app.models.alert import Alert, AlertSeverity
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class DashboardStats(BaseModel):
    """Aggregated statistics for dashboard overview"""
    total_artists: int
    total_streams: int
    avg_momentum: float
    total_superfans: int
    pending_actions: int
    critical_actions: int
    recent_alerts: int
    artists_growing: int
    artists_declining: int


class TopArtist(BaseModel):
    """Top performing artist"""
    id: str
    name: str
    image_url: Optional[str]
    momentum_score: float
    momentum_status: str
    trend_7d: Optional[float]


class RecentActivity(BaseModel):
    """Recent activity item"""
    type: str  # 'action', 'alert', 'momentum_change'
    artist_id: str
    artist_name: str
    title: str
    description: str
    timestamp: datetime
    severity: Optional[str]


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get aggregated statistics for dashboard overview"""

    # Get all user's artists
    artists = db.query(Artist).filter(Artist.user_id == current_user.id).all()
    artist_ids = [artist.id for artist in artists]

    if not artist_ids:
        return DashboardStats(
            total_artists=0,
            total_streams=0,
            avg_momentum=0.0,
            total_superfans=0,
            pending_actions=0,
            critical_actions=0,
            recent_alerts=0,
            artists_growing=0,
            artists_declining=0
        )

    # Total streams - sum from latest momentum scores
    total_streams = 0
    momentum_scores = []
    try:
        momentum_scores = db.query(MomentumScore).filter(
            MomentumScore.artist_id.in_(artist_ids)
        ).all()
    except Exception as e:
        logger.warning(f"Could not query momentum_scores: {e}")

    # For each artist, get their latest stream count
    for artist_id in artist_ids:
        artist_momentum = [m for m in momentum_scores if str(m.artist_id) == str(artist_id)]
        if artist_momentum:
            # Get latest momentum record
            latest = max(artist_momentum, key=lambda x: x.calculated_at)
            # Add streams from signals if available
            if hasattr(latest, 'signals') and latest.signals:
                signals = latest.signals
                if isinstance(signals, dict) and 'total_streams' in signals:
                    total_streams += int(signals.get('total_streams', 0))

    # Average momentum score
    avg_momentum = 0.0
    try:
        recent_momentum = db.query(MomentumScore).filter(
            MomentumScore.artist_id.in_(artist_ids),
            MomentumScore.calculated_at >= datetime.utcnow() - timedelta(days=7)
        ).all()

        if recent_momentum:
            # Use overall_score not score
            avg_momentum = sum(m.overall_score for m in recent_momentum) / len(recent_momentum)
    except Exception as e:
        logger.warning(f"Could not calculate avg momentum: {e}")

    # Count by status
    latest_momentum_by_artist = {}
    for artist_id in artist_ids:
        artist_momentum = [m for m in momentum_scores if str(m.artist_id) == str(artist_id)]
        if artist_momentum:
            latest_momentum_by_artist[str(artist_id)] = max(
                artist_momentum,
                key=lambda x: x.calculated_at
            )

    artists_growing = 0
    artists_declining = 0
    try:
        # Use momentum_category not status
        artists_growing = sum(
            1 for m in latest_momentum_by_artist.values()
            if m.momentum_category and m.momentum_category.lower() in ['fire', 'growing', 'rising']
        )
        artists_declining = sum(
            1 for m in latest_momentum_by_artist.values()
            if m.momentum_category and m.momentum_category.lower() in ['declining', 'falling']
        )
    except Exception as e:
        logger.warning(f"Could not count artist status: {e}")

    # Total superfans
    total_superfans = 0
    try:
        total_superfans = db.query(func.count(Superfan.id)).filter(
            Superfan.artist_id.in_(artist_ids)
        ).scalar() or 0
    except Exception as e:
        logger.warning(f"Could not count superfans: {e}")

    # Pending actions
    pending_actions = 0
    try:
        pending_actions = db.query(func.count(NextBestAction.id)).filter(
            NextBestAction.artist_id.in_(artist_ids),
            NextBestAction.status == ActionStatus.PENDING
        ).scalar() or 0
    except Exception as e:
        logger.warning(f"Could not count pending actions: {e}")

    # Critical actions
    critical_actions = 0
    try:
        critical_actions = db.query(func.count(NextBestAction.id)).filter(
            NextBestAction.artist_id.in_(artist_ids),
            NextBestAction.status == ActionStatus.PENDING,
            NextBestAction.urgency == 'critical'
        ).scalar() or 0
    except Exception as e:
        logger.warning(f"Could not count critical actions: {e}")

    # Recent alerts (last 7 days)
    recent_alerts = 0
    try:
        recent_alerts = db.query(func.count(Alert.id)).filter(
            Alert.artist_id.in_(artist_ids),
            Alert.created_at >= datetime.utcnow() - timedelta(days=7)
        ).scalar() or 0
    except Exception as e:
        logger.warning(f"Could not count recent alerts: {e}")

    return DashboardStats(
        total_artists=len(artists),
        total_streams=total_streams,
        avg_momentum=round(avg_momentum, 2),
        total_superfans=total_superfans,
        pending_actions=pending_actions,
        critical_actions=critical_actions,
        recent_alerts=recent_alerts,
        artists_growing=artists_growing,
        artists_declining=artists_declining
    )


@router.get("/top-performers", response_model=List[TopArtist])
async def get_top_performers(
    limit: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get top performing artists by momentum score"""

    # Get all user's artists
    artists = db.query(Artist).filter(Artist.user_id == current_user.id).all()
    artist_ids = [artist.id for artist in artists]

    if not artist_ids:
        return []

    # Get latest momentum score for each artist
    latest_momentum = []
    try:
        for artist in artists:
            momentum = db.query(MomentumScore).filter(
                MomentumScore.artist_id == artist.id
            ).order_by(MomentumScore.calculated_at.desc()).first()

            if momentum:
                latest_momentum.append({
                    'artist': artist,
                    'momentum': momentum
                })
    except Exception as e:
        logger.warning(f"Could not query momentum scores: {e}")
        return []

    # Sort by momentum score (use overall_score not score)
    if latest_momentum:
        latest_momentum.sort(key=lambda x: x['momentum'].overall_score, reverse=True)

    # Return top performers
    result = []
    for item in latest_momentum[:limit]:
        artist = item['artist']
        momentum = item['momentum']

        # Use overall_score, momentum_category, and calculate trend manually
        result.append(TopArtist(
            id=str(artist.id),
            name=artist.name,
            image_url=artist.image_url,
            momentum_score=momentum.overall_score,
            momentum_status=momentum.momentum_category or 'steady',
            trend_7d=None  # MomentumScore model doesn't have trend_7d field
        ))

    return result


@router.get("/recent-activity", response_model=List[RecentActivity])
async def get_recent_activity(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent activity across all artists"""

    # Get all user's artists
    artists = db.query(Artist).filter(Artist.user_id == current_user.id).all()
    artist_ids = [artist.id for artist in artists]

    if not artist_ids:
        return []

    # Create artist lookup
    artist_lookup = {str(artist.id): artist for artist in artists}

    activities = []

    # Get recent alerts
    recent_alerts = []
    try:
        recent_alerts = db.query(Alert).filter(
            Alert.artist_id.in_(artist_ids),
            Alert.created_at >= datetime.utcnow() - timedelta(days=7)
        ).order_by(Alert.created_at.desc()).limit(5).all()
    except Exception as e:
        logger.warning(f"Could not query alerts: {e}")

    for alert in recent_alerts:
        artist = artist_lookup.get(str(alert.artist_id))
        if artist:
            # Create title from alert_type
            alert_titles = {
                'viral': 'Viral Spike Detected',
                'engagement_drop': 'Engagement Drop Alert',
                'opportunity': 'New Opportunity',
                'threat': 'Potential Threat'
            }
            title = alert_titles.get(alert.alert_type.value if hasattr(alert.alert_type, 'value') else alert.alert_type, 'Alert')

            activities.append(RecentActivity(
                type='alert',
                artist_id=str(alert.artist_id),
                artist_name=artist.name,
                title=title,
                description=alert.message,
                timestamp=alert.created_at,
                severity=alert.severity.value if hasattr(alert, 'severity') else None
            ))

    # Get recent completed actions
    recent_actions = []
    try:
        recent_actions = db.query(NextBestAction).filter(
            NextBestAction.artist_id.in_(artist_ids),
            NextBestAction.status.in_([ActionStatus.COMPLETED, ActionStatus.PENDING]),
            NextBestAction.created_at >= datetime.utcnow() - timedelta(days=7)
        ).order_by(NextBestAction.created_at.desc()).limit(5).all()
    except Exception as e:
        logger.warning(f"Could not query actions: {e}")

    for action in recent_actions:
        artist = artist_lookup.get(str(action.artist_id))
        if artist:
            activities.append(RecentActivity(
                type='action',
                artist_id=str(action.artist_id),
                artist_name=artist.name,
                title=action.title,
                description=action.description,
                timestamp=action.created_at,
                severity=action.urgency.value if hasattr(action.urgency, 'value') else str(action.urgency)
            ))

    # Sort all activities by timestamp
    activities.sort(key=lambda x: x.timestamp, reverse=True)

    return activities[:limit]
