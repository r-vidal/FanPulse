from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import date, datetime, timedelta
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.artist import Artist
from app.models.release import ReleaseScore, ScheduledRelease, ReleaseStatus
from app.services.release_optimizer import ReleaseOptimizer
from pydantic import BaseModel, ConfigDict, field_serializer
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class ReleaseScoreResponse(BaseModel):
    """Release score response model"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    release_date: date
    overall_score: float
    momentum_score: float
    competition_score: float
    historical_performance_score: float
    audience_readiness_score: float
    calendar_events_score: float
    competing_releases_count: int
    major_competing_artists: List[dict]
    predicted_first_week_streams: int
    confidence_interval_low: int
    confidence_interval_high: int
    advantages: List[str]
    risks: List[str]
    recommendation: str
    calculated_at: datetime

    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    @field_serializer('release_date')
    def serialize_date(self, value: date) -> str:
        return value.isoformat()

    @field_serializer('calculated_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat()


class ScheduledReleaseCreate(BaseModel):
    """Create scheduled release request"""
    title: str
    release_type: Optional[str] = "single"
    release_date: date
    notes: Optional[str] = None


class ScheduledReleaseResponse(BaseModel):
    """Scheduled release response model"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    artist_id: UUID
    title: str
    release_type: Optional[str]
    release_date: date
    status: ReleaseStatus
    chosen_score: Optional[float]
    notes: Optional[str]
    created_at: datetime

    @field_serializer('id', 'artist_id')
    def serialize_uuid(self, value: UUID) -> str:
        return str(value)

    @field_serializer('release_date')
    def serialize_date(self, value: date) -> str:
        return value.isoformat()

    @field_serializer('created_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat()

    @field_serializer('status')
    def serialize_status(self, value: ReleaseStatus) -> str:
        return value.value


class CompetingReleaseResponse(BaseModel):
    """Competing release info"""
    artist_name: str
    album_name: str
    album_type: Optional[str]
    followers: Optional[int]
    popularity: Optional[int]
    genres: Optional[List[str]]
    is_major: bool
    spotify_url: Optional[str]


@router.get("/{artist_id}/release-scores", response_model=List[ReleaseScoreResponse])
async def get_release_scores(
    artist_id: UUID,
    weeks: int = Query(default=8, ge=1, le=12, description="Number of weeks to analyze"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get optimized release date scores for an artist

    Returns scores for all Fridays in the next N weeks (default 8).
    Scores are calculated fresh if not cached, or returned from cache if recent.

    Query params:
    - weeks: Number of weeks ahead to analyze (1-12, default 8)
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
        # Check if we have recent cached scores (< 24 hours old)
        recent_cutoff = datetime.utcnow() - timedelta(hours=24)
        cached_scores = db.query(ReleaseScore).filter(
            ReleaseScore.artist_id == artist_id,
            ReleaseScore.calculated_at >= recent_cutoff
        ).order_by(ReleaseScore.release_date).all()

        if len(cached_scores) >= weeks:
            logger.info(f"Returning cached release scores for artist {artist_id}")
            return cached_scores[:weeks]

        # Calculate fresh scores
        logger.info(f"Calculating fresh release scores for artist {artist_id}")
        optimizer = ReleaseOptimizer(db)
        scores = optimizer.calculate_release_scores(str(artist_id), weeks_ahead=weeks)

        # Delete old scores for this artist
        db.query(ReleaseScore).filter(
            ReleaseScore.artist_id == artist_id
        ).delete(synchronize_session=False)

        # Save new scores
        for score in scores:
            db.add(score)

        db.commit()

        # Refresh to get IDs
        for score in scores:
            db.refresh(score)

        return scores

    except Exception as e:
        logger.error(f"Error getting release scores for artist {artist_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate release scores: {str(e)}"
        )


@router.get("/{artist_id}/release-scores/{release_date}", response_model=ReleaseScoreResponse)
async def get_release_score_detail(
    artist_id: UUID,
    release_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed score breakdown for a specific release date

    Returns comprehensive scoring data including advantages, risks,
    competing releases, and predictions.
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

    # Get or calculate score for this date
    score = db.query(ReleaseScore).filter(
        ReleaseScore.artist_id == artist_id,
        ReleaseScore.release_date == release_date
    ).first()

    if not score:
        # Calculate score on-demand
        try:
            optimizer = ReleaseOptimizer(db)
            score = optimizer._score_single_date(artist, release_date)
            db.add(score)
            db.commit()
            db.refresh(score)
        except Exception as e:
            logger.error(f"Error calculating score for {release_date}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to calculate release score"
            )

    return score


@router.get("/{artist_id}/competing-releases/{release_date}", response_model=List[CompetingReleaseResponse])
async def get_competing_releases(
    artist_id: UUID,
    release_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of competing music releases for a specific date

    Filtered by artist's genre if available.
    Sorted by follower count (descending).
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
        optimizer = ReleaseOptimizer(db)
        competing = optimizer.get_competing_releases(
            release_date=release_date,
            genre=artist.genre
        )

        return competing

    except Exception as e:
        logger.error(f"Error fetching competing releases: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch competing releases"
        )


@router.post("/{artist_id}/scheduled-releases", response_model=ScheduledReleaseResponse, status_code=status.HTTP_201_CREATED)
async def schedule_release(
    artist_id: UUID,
    release_data: ScheduledReleaseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Schedule a new release for an artist

    Saves the release plan along with the optimization score that
    helped inform the decision.
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

    # Get the score for this date (if available)
    score = db.query(ReleaseScore).filter(
        ReleaseScore.artist_id == artist_id,
        ReleaseScore.release_date == release_data.release_date
    ).first()

    chosen_score = score.overall_score if score else None
    chosen_breakdown = {
        "momentum": score.momentum_score,
        "competition": score.competition_score,
        "historical": score.historical_performance_score,
        "audience": score.audience_readiness_score,
        "calendar": score.calendar_events_score,
    } if score else None

    # Create scheduled release
    scheduled_release = ScheduledRelease(
        artist_id=artist_id,
        user_id=current_user.id,
        title=release_data.title,
        release_type=release_data.release_type,
        release_date=release_data.release_date,
        status=ReleaseStatus.PLANNED,
        chosen_score=chosen_score,
        chosen_score_breakdown=chosen_breakdown,
        notes=release_data.notes
    )

    db.add(scheduled_release)
    db.commit()
    db.refresh(scheduled_release)

    logger.info(
        f"Scheduled release '{release_data.title}' for artist {artist_id} "
        f"on {release_data.release_date} (score: {chosen_score})"
    )

    return scheduled_release


@router.get("/{artist_id}/scheduled-releases", response_model=List[ScheduledReleaseResponse])
async def get_scheduled_releases(
    artist_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all scheduled releases for an artist

    Returns upcoming and past releases, sorted by date (desc).
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

    releases = db.query(ScheduledRelease).filter(
        ScheduledRelease.artist_id == artist_id
    ).order_by(ScheduledRelease.release_date.desc()).all()

    return releases


@router.put("/{artist_id}/scheduled-releases/{release_id}", response_model=ScheduledReleaseResponse)
async def update_scheduled_release(
    artist_id: UUID,
    release_id: UUID,
    status: ReleaseStatus = Query(..., description="New status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update status of a scheduled release

    Can mark as confirmed, released, or cancelled.
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

    release = db.query(ScheduledRelease).filter(
        ScheduledRelease.id == release_id,
        ScheduledRelease.artist_id == artist_id
    ).first()

    if not release:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled release not found"
        )

    release.status = status

    if status == ReleaseStatus.RELEASED:
        release.released_at = datetime.utcnow()

    db.commit()
    db.refresh(release)

    return release


@router.delete("/{artist_id}/scheduled-releases/{release_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scheduled_release(
    artist_id: UUID,
    release_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a scheduled release
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

    release = db.query(ScheduledRelease).filter(
        ScheduledRelease.id == release_id,
        ScheduledRelease.artist_id == artist_id
    ).first()

    if not release:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled release not found"
        )

    db.delete(release)
    db.commit()

    return None
