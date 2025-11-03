from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.core.database import Base


class ActionUrgency(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ActionStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    SNOOZED = "snoozed"
    IGNORED = "ignored"


class NextBestAction(Base):
    """
    AI-generated actions for artists

    The Next Best Action Engine analyzes artist data and generates
    actionable recommendations prioritized by urgency and impact.
    """
    __tablename__ = "next_best_actions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("artists.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Action details
    action_type = Column(String, nullable=False)  # e.g., "capture_snapshot", "analyze_decline"
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    urgency = Column(Enum(ActionUrgency, values_callable=lambda x: [e.value for e in x]), nullable=False)

    # Reasoning
    reason = Column(String)  # Why this action is recommended
    expected_impact = Column(String)  # What impact this will have

    # Status tracking
    status = Column(
        Enum(ActionStatus, values_callable=lambda x: [e.value for e in x]),
        default=ActionStatus.PENDING,
        nullable=False
    )

    # Impact measurement
    impact_score = Column(Integer)  # 0-100 measured after completion
    impact_measured_at = Column(DateTime)

    # Timing
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime)
    snoozed_until = Column(DateTime)

    # Relationships
    artist = relationship("Artist", backref="actions")
    user = relationship("User", backref="actions")

    def __repr__(self):
        return f"<NextBestAction {self.action_type} for Artist {self.artist_id}>"
