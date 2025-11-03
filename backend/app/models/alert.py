from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.core.database import Base


class AlertType(str, enum.Enum):
    VIRAL = "viral"
    ENGAGEMENT_DROP = "engagement_drop"
    OPPORTUNITY = "opportunity"
    THREAT = "threat"


class AlertSeverity(str, enum.Enum):
    URGENT = "urgent"
    WARNING = "warning"
    INFO = "info"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("artists.id"), nullable=False)
    alert_type = Column(Enum(AlertType), nullable=False)
    severity = Column(Enum(AlertSeverity), nullable=False)
    message = Column(Text, nullable=False)
    data = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    resolved_at = Column(DateTime)

    # Relationships
    user = relationship("User", back_populates="alerts")
    artist = relationship("Artist", back_populates="alerts")
