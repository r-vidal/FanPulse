"""Release Optimizer database models"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Float, Integer, Boolean, JSON, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.core.database import Base


class ReleaseStatus(str, enum.Enum):
    """Status of a scheduled release"""
    PLANNED = "planned"
    CONFIRMED = "confirmed"
    RELEASED = "released"
    CANCELLED = "cancelled"


class ReleaseScore(Base):
    """
    Release date optimization scores

    Stores scoring data for each Friday in the next 8 weeks to help artists
    choose optimal release dates based on momentum, competition, and other factors.
    """
    __tablename__ = "release_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("artists.id"), nullable=False)

    # Date being scored
    release_date = Column(Date, nullable=False, index=True)

    # Overall score (0-10)
    overall_score = Column(Float, nullable=False)

    # Score breakdown (5 factors)
    momentum_score = Column(Float, nullable=False)  # Artist's current momentum (30%)
    competition_score = Column(Float, nullable=False)  # Analysis of competing releases (25%)
    historical_performance_score = Column(Float, nullable=False)  # Day of week performance (20%)
    audience_readiness_score = Column(Float, nullable=False)  # Fan engagement level (15%)
    calendar_events_score = Column(Float, nullable=False)  # Major events to avoid (10%)

    # Competition data
    competing_releases_count = Column(Integer, default=0)
    major_competing_artists = Column(JSON)  # List of notable artists releasing same day

    # Predictions
    predicted_first_week_streams = Column(Integer)
    confidence_interval_low = Column(Integer)
    confidence_interval_high = Column(Integer)

    # Insights
    advantages = Column(JSON)  # List of advantages for this date
    risks = Column(JSON)  # List of risks for this date
    recommendation = Column(String)  # Text recommendation

    # Metadata
    calculated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    data_snapshot = Column(JSON)  # Raw calculation data for debugging

    # Relationships
    artist = relationship("Artist", backref="release_scores")

    def __repr__(self):
        return f"<ReleaseScore {self.release_date} for Artist {self.artist_id}: {self.overall_score}/10>"


class ScheduledRelease(Base):
    """
    Planned or confirmed music releases

    Tracks artist's release schedule and links to the scoring data
    that helped make the decision.
    """
    __tablename__ = "scheduled_releases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("artists.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Release details
    title = Column(String, nullable=False)
    release_type = Column(String)  # single, EP, album, remix
    release_date = Column(Date, nullable=False, index=True)

    # Status
    status = Column(
        Enum(ReleaseStatus, values_callable=lambda x: [e.value for e in x]),
        default=ReleaseStatus.PLANNED,
        nullable=False
    )

    # Optimization data (snapshot from when date was chosen)
    chosen_score = Column(Float)  # Score at time of selection
    chosen_score_breakdown = Column(JSON)  # Full breakdown

    # Metadata
    notes = Column(String)  # User notes about the release
    external_links = Column(JSON)  # Links to distributor, pre-save, etc.

    # Actual performance (filled in after release)
    actual_first_week_streams = Column(Integer)
    actual_first_week_engagement = Column(Float)
    post_release_data = Column(JSON)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    released_at = Column(DateTime)

    # Relationships
    artist = relationship("Artist", backref="scheduled_releases")
    user = relationship("User", backref="scheduled_releases")

    def __repr__(self):
        return f"<ScheduledRelease '{self.title}' on {self.release_date}>"


class CompetingRelease(Base):
    """
    Cache of competing releases from Spotify/Apple Music

    Stores information about new music releases to analyze competition.
    Updated daily via background job scraping new releases.
    """
    __tablename__ = "competing_releases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Release info
    release_date = Column(Date, nullable=False, index=True)
    artist_name = Column(String, nullable=False)
    artist_spotify_id = Column(String, index=True)
    album_name = Column(String, nullable=False)
    album_type = Column(String)  # album, single, EP

    # Artist metrics (for weighing importance)
    artist_followers = Column(Integer)
    artist_popularity = Column(Integer)
    artist_monthly_listeners = Column(Integer)

    # Genre/classification
    genres = Column(JSON)  # List of genres

    # Platform data
    spotify_url = Column(String)
    apple_music_url = Column(String)

    # Track count
    total_tracks = Column(Integer)

    # Metadata
    is_major_release = Column(Boolean, default=False)  # Flag for major artists
    scraped_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    raw_data = Column(JSON)

    def __repr__(self):
        return f"<CompetingRelease '{self.artist_name}' on {self.release_date}>"
