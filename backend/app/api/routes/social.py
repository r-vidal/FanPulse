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


class SocialEngagementData(BaseModel):
    date: str
    instagram: int
    tiktok: int
    youtube: int


class SocialStats(BaseModel):
    total_engagement: int
    change_7d: float
    best_platform: str
    avg_engagement_rate: float


class SocialEngagementResponse(BaseModel):
    data: List[SocialEngagementData]
    stats: SocialStats


class OptimalTimeSlot(BaseModel):
    day: str
    hour: int
    engagement_score: int
    posts_count: int
    avg_engagement: int


class BestTimeToPostResponse(BaseModel):
    optimal_times: List[OptimalTimeSlot]
    best_day: str
    best_hour: int
    recommendations: List[str]


@router.get("/engagement", response_model=SocialEngagementResponse)
async def get_social_engagement(
    time_range: str = Query("30d", regex="^(7d|30d|90d)$"),
    artist_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get social media engagement data

    Args:
        time_range: Time range (7d, 30d, or 90d)
        artist_id: Optional artist ID filter

    Returns:
        Social engagement data with stats
    """
    days = 7 if time_range == '7d' else 30 if time_range == '30d' else 90

    # TODO: Replace with actual database query
    data: List[SocialEngagementData] = []
    start_date = datetime.utcnow() - timedelta(days=days)

    for i in range(days):
        date = start_date + timedelta(days=i)

        # Simulate realistic engagement patterns per platform
        weekend_boost = 1.3 if date.weekday() in [5, 6] else 1.0
        random_variation = 0.9 + random.random() * 0.2

        # Instagram typically has highest engagement
        instagram = int((1000 + random.random() * 500 + (i * 10)) * weekend_boost * random_variation)

        # TikTok has higher viral potential
        tiktok = int((2000 + random.random() * 800 + (i * 20)) * weekend_boost * random_variation)

        # YouTube more stable but lower
        youtube = int((500 + random.random() * 300 + (i * 5)) * weekend_boost * random_variation)

        data.append(SocialEngagementData(
            date=date.strftime("%b %d"),
            instagram=instagram,
            tiktok=tiktok,
            youtube=youtube
        ))

    # Calculate stats
    total_engagement = sum(d.instagram + d.tiktok + d.youtube for d in data)
    first_week = sum(d.instagram + d.tiktok + d.youtube for d in data[:7])
    last_week = sum(d.instagram + d.tiktok + d.youtube for d in data[-7:])
    growth = ((last_week - first_week) / first_week) * 100 if first_week > 0 else 0

    # Determine best platform
    platform_totals = {
        "Instagram": sum(d.instagram for d in data),
        "TikTok": sum(d.tiktok for d in data),
        "YouTube": sum(d.youtube for d in data),
    }
    best_platform = max(platform_totals, key=platform_totals.get)

    stats = SocialStats(
        total_engagement=total_engagement,
        change_7d=round(growth, 1),
        best_platform=best_platform.lower(),
        avg_engagement_rate=3.8 + random.random() * 1.5  # 3.8-5.3%
    )

    return SocialEngagementResponse(data=data, stats=stats)


@router.get("/optimal-times", response_model=BestTimeToPostResponse)
async def get_optimal_posting_times(
    artist_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get optimal posting times based on historical engagement data

    Returns best times to post for maximum engagement
    """
    # TODO: Replace with actual analysis of historical data
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    optimal_times: List[OptimalTimeSlot] = []

    # Generate realistic optimal time slots
    for day in days:
        for hour in [9, 12, 15, 18, 20]:
            score = random.randint(60, 95)
            optimal_times.append(OptimalTimeSlot(
                day=day,
                hour=hour,
                engagement_score=score,
                posts_count=random.randint(5, 20),
                avg_engagement=random.randint(300, 800)
            ))

    # Sort by engagement score
    optimal_times.sort(key=lambda x: x.engagement_score, reverse=True)

    # Get best overall time
    best_time = optimal_times[0]

    recommendations = [
        f"Post on {best_time.day}s at {best_time.hour}:00 for maximum engagement",
        "Weekend posts (Saturday/Sunday) typically get 30% more engagement",
        "Avoid posting between 2AM-6AM when engagement drops significantly",
        "Thursday and Friday evenings show strong engagement patterns",
    ]

    return BestTimeToPostResponse(
        optimal_times=optimal_times[:20],  # Return top 20
        best_day=best_time.day,
        best_hour=best_time.hour,
        recommendations=recommendations
    )


@router.get("/roi")
async def get_social_roi(
    artist_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get social media ROI metrics
    """
    # TODO: Replace with actual calculations
    return {
        "total_spend": 5000,
        "total_reach": 250000,
        "total_engagement": 15000,
        "cost_per_engagement": 0.33,
        "roi_percentage": 145.8,
        "conversion_rate": 2.3,
        "platforms": {
            "instagram": {"spend": 2500, "reach": 150000, "roi": 158.2},
            "tiktok": {"spend": 1500, "reach": 80000, "roi": 135.4},
            "twitter": {"spend": 1000, "reach": 20000, "roi": 98.7}
        }
    }


@router.get("/platform-metrics")
async def get_platform_metrics(
    platform: str = Query(..., regex="^(instagram|tiktok|twitter|facebook|youtube)$"),
    artist_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get platform-specific social media metrics
    """
    # TODO: Replace with actual platform data
    mock_data = {
        "instagram": {
            "followers": 45000,
            "following": 320,
            "posts": 487,
            "avg_likes": 1850,
            "avg_comments": 142,
            "engagement_rate": 4.2,
            "stories_views": 8500,
            "reach_30d": 125000
        },
        "tiktok": {
            "followers": 32000,
            "following": 89,
            "videos": 156,
            "avg_views": 12500,
            "avg_likes": 1250,
            "engagement_rate": 5.8,
            "total_views": 1950000
        },
        "twitter": {
            "followers": 18500,
            "following": 420,
            "tweets": 2340,
            "avg_likes": 85,
            "avg_retweets": 23,
            "engagement_rate": 2.1,
            "impressions_30d": 95000
        }
    }

    return mock_data.get(platform.lower(), {})
