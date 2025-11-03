from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Float, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base


class StreamHistory(Base):
    """
    Time-series data for streaming statistics
    Optimized for TimescaleDB hypertable
    """
    __tablename__ = "stream_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("artists.id"), nullable=False)
    platform_connection_id = Column(
        UUID(as_uuid=True),
        ForeignKey("platform_connections.id"),
        nullable=False
    )

    # Time-series timestamp (primary dimension for TimescaleDB)
    timestamp = Column(DateTime, nullable=False, index=True)

    # Streaming metrics
    total_streams = Column(Integer, default=0)
    daily_streams = Column(Integer, default=0)
    monthly_streams = Column(Integer, default=0)

    # Listener metrics
    total_listeners = Column(Integer, default=0)
    monthly_listeners = Column(Integer, default=0)
    daily_listeners = Column(Integer, default=0)

    # Follower metrics
    followers = Column(Integer, default=0)
    followers_change = Column(Integer, default=0)

    # Engagement metrics
    saves = Column(Integer, default=0)
    playlist_adds = Column(Integer, default=0)
    skip_rate = Column(Float)  # Percentage
    completion_rate = Column(Float)  # Percentage

    # Geographic data (top countries)
    top_countries = Column(JSONB)  # {"US": 45.2, "FR": 23.1, ...}

    # Demographic data
    demographics = Column(JSONB)  # {"age_18_24": 35, "gender_m": 60, ...}

    # Track-specific data (top tracks)
    top_tracks = Column(JSONB)  # [{"id": "...", "name": "...", "streams": 1000}, ...]

    # Raw platform data
    raw_data = Column(JSONB)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    artist = relationship("Artist", back_populates="stream_history")
    platform_connection = relationship("PlatformConnection", back_populates="stream_history")

    # Composite indexes for time-series queries
    __table_args__ = (
        Index("ix_stream_history_artist_time", "artist_id", "timestamp"),
        Index("ix_stream_history_platform_time", "platform_connection_id", "timestamp"),
    )

    def __repr__(self):
        return f"<StreamHistory {self.timestamp} - Artist {self.artist_id}>"
