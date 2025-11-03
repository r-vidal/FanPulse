from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import date, datetime, timedelta
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.artist import Artist
from app.models.revenue import RevenueForecast, RevenueActual, ForecastScenario
from app.services.revenue_forecasting import RevenueForecaster
from pydantic import BaseModel, ConfigDict, field_serializer
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class RevenueForecastResponse(BaseModel):
    """Revenue forecast response model"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    forecast_month: date
    scenario: ForecastScenario
    streaming_revenue: float
    concert_revenue: float
    merch_revenue: float
    sync_revenue: float
    total_revenue: float
    confidence_score: float
    margin_of_error: float
    calculated_at: datetime

    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    @field_serializer('forecast_month')
    def serialize_date(self, value: date) -> str:
        return value.isoformat()

    @field_serializer('calculated_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat()

    @field_serializer('scenario')
    def serialize_scenario(self, value: ForecastScenario) -> str:
        return value.value


class RevenueForecastSummary(BaseModel):
    """Summary of revenue forecasts with all 3 scenarios"""
    month: str
    optimistic: float
    realistic: float
    pessimistic: float
    confidence: float


class RevenueActualCreate(BaseModel):
    """Create revenue actual request"""
    revenue_month: date
    streaming_revenue: float
    concert_revenue: float = 0.0
    merch_revenue: float = 0.0
    sync_revenue: float = 0.0
    other_revenue: float = 0.0
    total_streams: Optional[int] = None
    notes: Optional[str] = None


class RevenueActualResponse(BaseModel):
    """Revenue actual response model"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    artist_id: UUID
    revenue_month: date
    streaming_revenue: float
    concert_revenue: float
    merch_revenue: float
    sync_revenue: float
    other_revenue: float
    total_revenue: float
    total_streams: Optional[int]
    notes: Optional[str]
    created_at: datetime

    @field_serializer('id', 'artist_id')
    def serialize_uuid(self, value: UUID) -> str:
        return str(value)

    @field_serializer('revenue_month')
    def serialize_date(self, value: date) -> str:
        return value.isoformat()

    @field_serializer('created_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat()


@router.get("/{artist_id}/forecasts", response_model=Dict[str, List[RevenueForecastResponse]])
async def get_revenue_forecasts(
    artist_id: UUID,
    months: int = Query(default=12, ge=3, le=12, description="Number of months to forecast"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get revenue forecasts for an artist

    Returns 3 scenarios (optimistic, realistic, pessimistic) for N months ahead.
    Forecasts are cached - calculated fresh if older than 30 days.

    Query params:
    - months: Number of months ahead (3-12, default 12)
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

    try:
        # Check for recent cached forecasts (< 30 days old)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        cached_forecasts = db.query(RevenueForecast).filter(
            RevenueForecast.artist_id == artist_id,
            RevenueForecast.calculated_at >= thirty_days_ago
        ).order_by(RevenueForecast.forecast_month).all()

        # Group by scenario
        cached_by_scenario = {}
        for forecast in cached_forecasts:
            scenario_key = forecast.scenario.value
            if scenario_key not in cached_by_scenario:
                cached_by_scenario[scenario_key] = []
            cached_by_scenario[scenario_key].append(forecast)

        # If we have fresh forecasts for all scenarios, return them
        if (len(cached_by_scenario.get("optimistic", [])) >= months and
            len(cached_by_scenario.get("realistic", [])) >= months and
            len(cached_by_scenario.get("pessimistic", [])) >= months):

            logger.info(f"Returning cached revenue forecasts for artist {artist_id}")
            return {
                "optimistic": cached_by_scenario["optimistic"][:months],
                "realistic": cached_by_scenario["realistic"][:months],
                "pessimistic": cached_by_scenario["pessimistic"][:months]
            }

        # Calculate fresh forecasts
        logger.info(f"Calculating fresh revenue forecasts for artist {artist_id}")
        forecaster = RevenueForecaster(db)
        forecasts = forecaster.forecast_revenue(str(artist_id), months_ahead=months)

        # Save to database
        forecaster.save_forecasts(forecasts)

        return forecasts

    except Exception as e:
        logger.error(f"Error getting revenue forecasts for artist {artist_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate revenue forecasts: {str(e)}"
        )


@router.get("/{artist_id}/forecasts/summary", response_model=List[RevenueForecastSummary])
async def get_revenue_forecast_summary(
    artist_id: UUID,
    months: int = Query(default=6, ge=3, le=12),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get revenue forecast summary (simplified view with all 3 scenarios per month)

    Returns a simplified summary perfect for charts and visualization
    """
    # Verify artist
    artist = db.query(Artist).filter(
        Artist.id == artist_id,
        Artist.user_id == current_user.id
    ).first()

    if not artist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

    # Get forecasts (will use cache or calculate fresh)
    forecasts = await get_revenue_forecasts(artist_id, months, current_user, db)

    # Transform to summary format
    summary = []
    for i in range(months):
        opt = forecasts["optimistic"][i] if i < len(forecasts["optimistic"]) else None
        real = forecasts["realistic"][i] if i < len(forecasts["realistic"]) else None
        pess = forecasts["pessimistic"][i] if i < len(forecasts["pessimistic"]) else None

        if opt and real and pess:
            summary.append(RevenueForecastSummary(
                month=opt.forecast_month.isoformat(),
                optimistic=opt.total_revenue,
                realistic=real.total_revenue,
                pessimistic=pess.total_revenue,
                confidence=real.confidence_score
            ))

    return summary


@router.get("/{artist_id}/forecasts/{forecast_month}", response_model=Dict[str, Any])
async def get_forecast_detail(
    artist_id: UUID,
    forecast_month: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed forecast for a specific month

    Returns breakdown by scenario and revenue source
    """
    # Verify artist
    artist = db.query(Artist).filter(
        Artist.id == artist_id,
        Artist.user_id == current_user.id
    ).first()

    if not artist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

    # Get forecasts for this month (all scenarios)
    forecasts = db.query(RevenueForecast).filter(
        RevenueForecast.artist_id == artist_id,
        RevenueForecast.forecast_month == forecast_month
    ).all()

    if not forecasts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No forecast found for this month"
        )

    # Group by scenario
    result = {}
    for forecast in forecasts:
        result[forecast.scenario.value] = {
            "total_revenue": forecast.total_revenue,
            "streaming_revenue": forecast.streaming_revenue,
            "concert_revenue": forecast.concert_revenue,
            "merch_revenue": forecast.merch_revenue,
            "sync_revenue": forecast.sync_revenue,
            "confidence_score": forecast.confidence_score,
            "margin_of_error": forecast.margin_of_error,
            "feature_data": forecast.feature_data
        }

    return result


@router.post("/{artist_id}/actuals", response_model=RevenueActualResponse, status_code=status.HTTP_201_CREATED)
async def create_revenue_actual(
    artist_id: UUID,
    actual_data: RevenueActualCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record actual revenue for a month

    This helps measure forecast accuracy and improve predictions over time
    """
    # Verify artist
    artist = db.query(Artist).filter(
        Artist.id == artist_id,
        Artist.user_id == current_user.id
    ).first()

    if not artist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

    # Calculate total revenue
    total_revenue = (
        actual_data.streaming_revenue +
        actual_data.concert_revenue +
        actual_data.merch_revenue +
        actual_data.sync_revenue +
        actual_data.other_revenue
    )

    # Calculate average stream rate if streams provided
    avg_stream_rate = None
    if actual_data.total_streams and actual_data.total_streams > 0:
        avg_stream_rate = actual_data.streaming_revenue / actual_data.total_streams

    # Check if actual already exists for this month
    existing = db.query(RevenueActual).filter(
        RevenueActual.artist_id == artist_id,
        RevenueActual.revenue_month == actual_data.revenue_month
    ).first()

    if existing:
        # Update existing
        existing.streaming_revenue = actual_data.streaming_revenue
        existing.concert_revenue = actual_data.concert_revenue
        existing.merch_revenue = actual_data.merch_revenue
        existing.sync_revenue = actual_data.sync_revenue
        existing.other_revenue = actual_data.other_revenue
        existing.total_revenue = total_revenue
        existing.total_streams = actual_data.total_streams
        existing.average_stream_rate = avg_stream_rate
        existing.notes = actual_data.notes
        existing.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(existing)

        return existing

    # Create new actual
    revenue_actual = RevenueActual(
        artist_id=artist_id,
        revenue_month=actual_data.revenue_month,
        streaming_revenue=actual_data.streaming_revenue,
        concert_revenue=actual_data.concert_revenue,
        merch_revenue=actual_data.merch_revenue,
        sync_revenue=actual_data.sync_revenue,
        other_revenue=actual_data.other_revenue,
        total_revenue=total_revenue,
        total_streams=actual_data.total_streams,
        average_stream_rate=avg_stream_rate,
        notes=actual_data.notes
    )

    db.add(revenue_actual)
    db.commit()
    db.refresh(revenue_actual)

    logger.info(f"Created revenue actual for artist {artist_id}, month {actual_data.revenue_month}")

    return revenue_actual


@router.get("/{artist_id}/actuals", response_model=List[RevenueActualResponse])
async def get_revenue_actuals(
    artist_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all recorded actual revenue for an artist

    Returns historical revenue data sorted by month (descending)
    """
    # Verify artist
    artist = db.query(Artist).filter(
        Artist.id == artist_id,
        Artist.user_id == current_user.id
    ).first()

    if not artist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

    actuals = db.query(RevenueActual).filter(
        RevenueActual.artist_id == artist_id
    ).order_by(RevenueActual.revenue_month.desc()).all()

    return actuals
