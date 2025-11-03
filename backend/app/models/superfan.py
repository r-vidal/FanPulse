from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base


class Superfan(Base):
    __tablename__ = "superfans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("artists.id"), nullable=False)
    platform_user_id = Column(String, nullable=False, index=True)
    fvs_score = Column(Float, nullable=False, default=0.0)

    # Stats
    listening_hours = Column(Float, default=0.0)
    engagement_score = Column(Float, default=0.0)
    monetization_score = Column(Float, default=0.0)

    # Contact and location
    location = Column(String)
    contact_info = Column(JSONB)

    # Metadata
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    artist = relationship("Artist", back_populates="superfans")
