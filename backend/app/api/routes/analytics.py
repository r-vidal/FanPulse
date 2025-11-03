"""Analytics API routes"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional, Dict, Any

from app.core.database import get_db
from app.models.user import User
from app.models.artist import Artist
from app.api.deps import get_current_user
from app.services.analytics.fvs import FVSCalculator
from app.services.analytics.momentum import MomentumCalculator
from app.services.analytics.superfan import SuperfanAnalyzer
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])


# Pydantic schemas
class FVSResponse(BaseModel):
    fvs: float
    breakdown: Dict[str, Any]
    calculated_at: datetime
    period_days: int


class MomentumResponse(BaseModel):
    momentum_index: float
    status: str
    trend: str
    breakdown: Dict[str, Any]
    calculated_at: datetime
    period_days: int


class SuperfanInsightsResponse(BaseModel):
    total_superfans: int
    active_last_30_days: int
    activity_rate: float
    tier_distribution: Dict[str, int]
    average_lifetime_value: float
    average_engagement_score: float
    total_lifetime_value: float
    calculated_at: datetime


class BreakoutPredictionResponse(BaseModel):
    prediction: str
    probability: float
    indicators: Dict[str, bool]
    momentum_index: float
    recommendation: str


class ArtistOverviewResponse(BaseModel):
    artist_id: str
    artist_name: str
    fvs: Optional[FVSResponse]
    momentum: Optional[MomentumResponse]
    superfan_count: int
    platform_count: int
    total_followers: int
    total_monthly_listeners: int


# Helper function to verify artist ownership
def verify_artist_ownership(artist_id: str, user: User, db: Session) -> Artist:
    """Verify that the artist belongs to the current user"""
    artist = db.query(Artist).filter(
        Artist.id == artist_id,
        Artist.user_id == user.id,
    ).first()

    if not artist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found or access denied",
        )

    return artist


@router.get("/{artist_id}/fvs", response_model=FVSResponse)
async def get_fvs_score(
    artist_id: str,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get Fan Value Score (FVS) for an artist

    The FVS is a comprehensive metric (0-100) that quantifies the value
    of an artist's fanbase across engagement, growth, reach, and conversion.
    """
    # Verify ownership
    artist = verify_artist_ownership(artist_id, current_user, db)

    try:
        calculator = FVSCalculator(db)
        fvs_data = calculator.calculate_fvs(artist_id, days=days)

        return FVSResponse(**fvs_data)

    except Exception as e:
        logger.error(f"Error calculating FVS for artist {artist_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating FVS: {str(e)}",
        )


@router.get("/{artist_id}/fvs/trend")
async def get_fvs_trend(
    artist_id: str,
    months: int = Query(6, ge=1, le=24, description="Number of months to analyze"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get FVS trend over time

    Returns historical FVS scores to track improvement or decline
    """
    artist = verify_artist_ownership(artist_id, current_user, db)

    try:
        calculator = FVSCalculator(db)
        trend = calculator.get_fvs_trend(artist_id, months=months)

        return {
            "artist_id": artist_id,
            "artist_name": artist.name,
            "trend": trend,
        }

    except Exception as e:
        logger.error(f"Error getting FVS trend for artist {artist_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting FVS trend: {str(e)}",
        )


@router.get("/{artist_id}/momentum", response_model=MomentumResponse)
async def get_momentum_index(
    artist_id: str,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get Momentum Index for an artist

    The Momentum Index (0-10) tracks growth velocity and trajectory,
    helping identify artists who are "heating up" or "cooling down".
    """
    artist = verify_artist_ownership(artist_id, current_user, db)

    try:
        calculator = MomentumCalculator(db)
        momentum_data = calculator.calculate_momentum(artist_id, days=days)

        return MomentumResponse(**momentum_data)

    except Exception as e:
        logger.error(f"Error calculating momentum for artist {artist_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating momentum: {str(e)}",
        )


@router.get("/{artist_id}/momentum/trend")
async def get_momentum_trend(
    artist_id: str,
    weeks: int = Query(12, ge=1, le=52, description="Number of weeks to analyze"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get momentum trend over time

    Returns weekly momentum scores to track growth patterns
    """
    artist = verify_artist_ownership(artist_id, current_user, db)

    try:
        calculator = MomentumCalculator(db)
        trend = calculator.get_momentum_trend(artist_id, weeks=weeks)

        return {
            "artist_id": artist_id,
            "artist_name": artist.name,
            "trend": trend,
        }

    except Exception as e:
        logger.error(f"Error getting momentum trend for artist {artist_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting momentum trend: {str(e)}",
        )


@router.get("/{artist_id}/breakout", response_model=BreakoutPredictionResponse)
async def predict_breakout(
    artist_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Predict if an artist is on track for a breakout

    Analyzes momentum indicators to determine breakout probability
    """
    artist = verify_artist_ownership(artist_id, current_user, db)

    try:
        calculator = MomentumCalculator(db)
        prediction = calculator.predict_breakout(artist_id)

        return BreakoutPredictionResponse(**prediction)

    except Exception as e:
        logger.error(f"Error predicting breakout for artist {artist_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error predicting breakout: {str(e)}",
        )


@router.get("/{artist_id}/superfans", response_model=SuperfanInsightsResponse)
async def get_superfan_insights(
    artist_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get superfan insights for an artist

    Returns statistics about the artist's most engaged fans
    """
    artist = verify_artist_ownership(artist_id, current_user, db)

    try:
        analyzer = SuperfanAnalyzer(db)
        insights = analyzer.get_superfan_insights(artist_id)

        return SuperfanInsightsResponse(**insights)

    except Exception as e:
        logger.error(f"Error getting superfan insights for artist {artist_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting superfan insights: {str(e)}",
        )


@router.get("/{artist_id}/superfans/list")
async def list_superfans(
    artist_id: str,
    min_score: float = Query(7.0, ge=0, le=10, description="Minimum engagement score"),
    days: int = Query(90, ge=1, le=365, description="Analysis period in days"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List superfans for an artist

    Returns detailed list of superfans with engagement scores and tiers
    """
    artist = verify_artist_ownership(artist_id, current_user, db)

    try:
        analyzer = SuperfanAnalyzer(db)
        superfans = analyzer.identify_superfans(
            artist_id,
            min_engagement_score=min_score,
            days=days,
        )

        return {
            "artist_id": artist_id,
            "artist_name": artist.name,
            "total_superfans": len(superfans),
            "superfans": superfans,
        }

    except Exception as e:
        logger.error(f"Error listing superfans for artist {artist_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing superfans: {str(e)}",
        )


@router.get("/{artist_id}/superfans/segments")
async def get_superfan_segments(
    artist_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get superfan segments for targeted marketing

    Segments:
    - Champions: High engagement + high LTV
    - At Risk: High engagement but inactive
    - New & Promising: Recently added with good engagement
    - Need Nurturing: Low engagement, need activation
    """
    artist = verify_artist_ownership(artist_id, current_user, db)

    try:
        analyzer = SuperfanAnalyzer(db)
        segments = analyzer.get_superfan_segments(artist_id)

        return {
            "artist_id": artist_id,
            "artist_name": artist.name,
            "segments": segments,
        }

    except Exception as e:
        logger.error(f"Error getting superfan segments for artist {artist_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting superfan segments: {str(e)}",
        )


@router.get("/{artist_id}/superfans/churn-risk")
async def get_churn_risk(
    artist_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get superfan churn risk analysis

    Identifies superfans at risk of becoming inactive
    """
    artist = verify_artist_ownership(artist_id, current_user, db)

    try:
        analyzer = SuperfanAnalyzer(db)
        churn_data = analyzer.get_churn_risk(artist_id)

        return {
            "artist_id": artist_id,
            "artist_name": artist.name,
            **churn_data,
        }

    except Exception as e:
        logger.error(f"Error calculating churn risk for artist {artist_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating churn risk: {str(e)}",
        )


@router.get("/{artist_id}/overview", response_model=ArtistOverviewResponse)
async def get_artist_overview(
    artist_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get comprehensive analytics overview for an artist

    Returns FVS, Momentum, Superfan stats, and platform metrics
    """
    artist = verify_artist_ownership(artist_id, current_user, db)

    try:
        # Calculate all metrics
        fvs_calc = FVSCalculator(db)
        momentum_calc = MomentumCalculator(db)
        superfan_analyzer = SuperfanAnalyzer(db)

        # Get FVS
        try:
            fvs_data = fvs_calc.calculate_fvs(artist_id, days=30)
            fvs_response = FVSResponse(**fvs_data)
        except Exception as e:
            logger.warning(f"Could not calculate FVS: {e}")
            fvs_response = None

        # Get Momentum
        try:
            momentum_data = momentum_calc.calculate_momentum(artist_id, days=30)
            momentum_response = MomentumResponse(**momentum_data)
        except Exception as e:
            logger.warning(f"Could not calculate momentum: {e}")
            momentum_response = None

        # Get superfan count
        try:
            superfan_insights = superfan_analyzer.get_superfan_insights(artist_id)
            superfan_count = superfan_insights["total_superfans"]
        except Exception as e:
            logger.warning(f"Could not get superfan count: {e}")
            superfan_count = 0

        # Get platform stats
        from app.models.platform import PlatformConnection
        from app.models.stream_history import StreamHistory

        platform_count = db.query(PlatformConnection).filter(
            PlatformConnection.artist_id == artist_id,
            PlatformConnection.is_active == True,
        ).count()

        # Get latest stream history for totals
        latest_history = db.query(StreamHistory).filter(
            StreamHistory.artist_id == artist_id,
        ).order_by(StreamHistory.timestamp.desc()).limit(10).all()

        total_followers = sum([h.followers or 0 for h in latest_history])
        total_listeners = sum([h.monthly_listeners or 0 for h in latest_history])

        return ArtistOverviewResponse(
            artist_id=artist_id,
            artist_name=artist.name,
            fvs=fvs_response,
            momentum=momentum_response,
            superfan_count=superfan_count,
            platform_count=platform_count,
            total_followers=total_followers,
            total_monthly_listeners=total_listeners,
        )

    except Exception as e:
        logger.error(f"Error getting artist overview for {artist_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting artist overview: {str(e)}",
        )
