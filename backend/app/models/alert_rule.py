from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum, Float, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.core.database import Base


class AlertRuleType(str, enum.Enum):
    """Types of alert rules"""
    MOMENTUM_SPIKE = "momentum_spike"  # Momentum index exceeds threshold
    MOMENTUM_DROP = "momentum_drop"  # Momentum index drops below threshold
    FVS_THRESHOLD = "fvs_threshold"  # FVS crosses threshold
    FOLLOWER_MILESTONE = "follower_milestone"  # Reach follower count
    VIRAL_POST = "viral_post"  # Post goes viral
    ENGAGEMENT_DROP = "engagement_drop"  # Engagement rate drops
    SUPERFAN_CHURN = "superfan_churn"  # Superfans becoming inactive
    GROWTH_STALL = "growth_stall"  # Growth rate declines


class AlertRule(Base):
    """
    User-configured alert rules

    Allows users to set up custom alerts based on various conditions
    """
    __tablename__ = "alert_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("artists.id"), nullable=False)

    # Rule configuration
    rule_type = Column(Enum(AlertRuleType), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)

    # Threshold configuration
    threshold_value = Column(Float)  # Numeric threshold (e.g., FVS > 80, Momentum > 7)
    comparison_operator = Column(String)  # "gt", "lt", "eq", "gte", "lte"

    # Notification settings
    is_active = Column(Boolean, default=True, nullable=False)
    notify_email = Column(Boolean, default=True, nullable=False)
    notify_in_app = Column(Boolean, default=True, nullable=False)

    # Cooldown to prevent spam (in hours)
    cooldown_hours = Column(Integer, default=24)
    last_triggered_at = Column(DateTime)

    # Additional configuration
    config = Column(JSONB)  # Rule-specific configuration

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="alert_rules")
    artist = relationship("Artist", back_populates="alert_rules")

    def __repr__(self):
        return f"<AlertRule {self.name} - {self.rule_type}>"


class Notification(Base):
    """
    Notifications sent to users

    Tracks all notifications (email, in-app) sent to users
    """
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    alert_id = Column(UUID(as_uuid=True), ForeignKey("alerts.id"))

    # Notification content
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String)  # "alert", "update", "info"

    # Delivery
    channel = Column(String)  # "email", "in_app", "sms"
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime)

    # Metadata
    data = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="notifications")
    alert = relationship("Alert")

    def __repr__(self):
        return f"<Notification {self.title} - {self.channel}>"
