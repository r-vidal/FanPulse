"""
Scheduled Post Model

Posts scheduled for publishing across multiple platforms
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Boolean, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class PostStatus(str, enum.Enum):
    """Post status enum"""

    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ScheduledPost(Base):
    """
    Scheduled social media post

    Supports multi-platform publishing with AI-generated captions
    """

    __tablename__ = "scheduled_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("artists.id"), nullable=True)

    # Post content
    caption = Column(Text, nullable=False)
    media_urls = Column(JSON, default=list)  # List of URLs to media files
    hashtags = Column(JSON, default=list)  # List of hashtags

    # Platforms to publish to
    platforms = Column(JSON, default=list)  # ["instagram", "tiktok", "facebook", "twitter"]
    platform_specific_settings = Column(JSON, default=dict)  # Platform-specific configs

    # Scheduling
    status = Column(SQLEnum(PostStatus), default=PostStatus.DRAFT, nullable=False)
    scheduled_for = Column(DateTime(timezone=True), nullable=True)  # UTC
    published_at = Column(DateTime(timezone=True), nullable=True)

    # Results
    publish_results = Column(
        JSON, default=dict
    )  # {"instagram": {"post_id": "...", "url": "..."}}
    error_message = Column(Text, nullable=True)

    # AI-generated variations
    ai_caption_variations = Column(JSON, default=list)  # AI-generated caption alternatives
    ai_metadata = Column(JSON, default=dict)  # AI generation metadata

    # Audit
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="scheduled_posts")
    artist = relationship("Artist")

    def __repr__(self):
        return f"<ScheduledPost {self.id} - {self.status} - {self.scheduled_for}>"


# Add to User model relationship
from app.models.user import User

if not hasattr(User, "scheduled_posts"):
    User.scheduled_posts = relationship(
        "ScheduledPost", back_populates="user", cascade="all, delete-orphan"
    )
