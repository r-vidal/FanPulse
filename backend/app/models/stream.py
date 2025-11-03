from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base


class Stream(Base):
    __tablename__ = "streams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("artists.id"), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    platform = Column(String, nullable=False)
    streams = Column(Integer, default=0)
    followers = Column(Integer, default=0)

    # Relationships
    artist = relationship("Artist", back_populates="streams")

    # Composite index for time-series queries
    __table_args__ = (
        Index("ix_streams_artist_timestamp", "artist_id", "timestamp"),
    )
