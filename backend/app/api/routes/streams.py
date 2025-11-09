from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime, timedelta
import random

router = APIRouter()


class StreamDataPoint(BaseModel):
    date: str
    total: int
    spotify: int
    appleMusic: int
    youtube: int
    other: int


class StreamStats(BaseModel):
    total_30d: int
    change_30d: float
    average_daily: int
    peak_day: str
    peak_streams: int


class StreamEvolutionResponse(BaseModel):
    data: List[StreamDataPoint]
    stats: StreamStats


@router.get("/evolution", response_model=StreamEvolutionResponse)
async def get_stream_evolution(
    time_range: str = Query("30d", regex="^(7d|30d|90d)$"),
    artist_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get stream evolution data for selected time range

    Args:
        time_range: Time range (7d, 30d, or 90d)
        artist_id: Optional artist ID filter (defaults to all artists)

    Returns:
        Stream evolution data with stats
    """
    # Parse time range
    days = 7 if time_range == '7d' else 30 if time_range == '30d' else 90

    # TODO: Replace with actual database query
    # For now, generate realistic mock data
    data: List[StreamDataPoint] = []
    start_date = datetime.utcnow() - timedelta(days=days)

    for i in range(days):
        date = start_date + timedelta(days=i)

        # Simulate realistic streaming patterns
        base_streams = 15000 + random.random() * 5000
        trend = (i / days) * 10000  # Gradual uptrend
        weekend_boost = 1.2 if date.weekday() in [4, 5] else 1.0
        random_variation = 0.9 + random.random() * 0.2

        total = int((base_streams + trend) * weekend_boost * random_variation)

        data.append(StreamDataPoint(
            date=date.strftime("%b %d"),
            total=total,
            spotify=int(total * 0.65),
            appleMusic=int(total * 0.20),
            youtube=int(total * 0.10),
            other=int(total * 0.05)
        ))

    # Calculate stats
    total_streams = sum(d.total for d in data)
    first_week_total = sum(d.total for d in data[:7])
    last_week_total = sum(d.total for d in data[-7:])
    change = ((last_week_total - first_week_total) / first_week_total) * 100 if first_week_total > 0 else 0

    peak_day = max(data, key=lambda d: d.total)

    stats = StreamStats(
        total_30d=total_streams,
        change_30d=round(change, 1),
        average_daily=int(total_streams / days),
        peak_day=peak_day.date,
        peak_streams=peak_day.total
    )

    return StreamEvolutionResponse(data=data, stats=stats)


@router.get("/platforms")
async def get_platform_breakdown(
    artist_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get streaming platform breakdown
    """
    # TODO: Replace with actual data
    return {
        "spotify": {"streams": 650000, "percentage": 65.0, "growth": 12.5},
        "appleMusic": {"streams": 200000, "percentage": 20.0, "growth": 8.3},
        "youtube": {"streams": 100000, "percentage": 10.0, "growth": 15.7},
        "other": {"streams": 50000, "percentage": 5.0, "growth": 5.2}
    }


@router.get("/top-tracks")
async def get_top_tracks(
    limit: int = Query(10, ge=1, le=50),
    artist_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get top tracks by streams
    """
    # TODO: Replace with actual data
    mock_tracks = [
        {"name": "Summer Vibes", "streams": 125000, "growth": 15.3},
        {"name": "Midnight Drive", "streams": 98000, "growth": 8.7},
        {"name": "Golden Hour", "streams": 87000, "growth": -2.1},
        {"name": "City Lights", "streams": 76000, "growth": 12.4},
        {"name": "Ocean Breeze", "streams": 65000, "growth": 5.8},
        {"name": "Mountain High", "streams": 54000, "growth": 22.1},
        {"name": "Desert Dreams", "streams": 43000, "growth": -5.3},
        {"name": "Rainy Days", "streams": 38000, "growth": 3.2},
        {"name": "Starlight", "streams": 29000, "growth": 18.9},
        {"name": "Horizon", "streams": 21000, "growth": 7.4},
    ]

    return mock_tracks[:limit]
