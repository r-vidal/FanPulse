"""Momentum Score models (placeholder for future implementation)"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class MomentumScore(Base):
    """
    Artist momentum score

    Tracks an artist's career momentum based on multiple factors.
    This is a placeholder model - full implementation pending.
    """
    __tablename__ = "momentum_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("artists.id", ondelete="CASCADE"), nullable=False)

    # Scores
    overall_score = Column(Float, nullable=False, server_default="5.0")
    velocity_score = Column(Float, nullable=False, server_default="5.0")
    consistency_score = Column(Float, nullable=False, server_default="5.0")

    # Category
    momentum_category = Column(String(20), server_default="Steady")

    # Insights
    key_insights = Column(JSON, default=list)

    # Timestamp
    calculated_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    # Relationships
    artist = relationship("Artist")

    def __repr__(self):
        return f"<MomentumScore {self.overall_score}/10 ({self.momentum_category})>"
