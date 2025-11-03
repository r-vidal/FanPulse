from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Float, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base


class SocialPost(Base):
    """
    Social media posts from Instagram, TikTok, etc.
    """
    __tablename__ = "social_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("artists.id"), nullable=False)
    platform_connection_id = Column(
        UUID(as_uuid=True),
        ForeignKey("platform_connections.id"),
        nullable=False
    )

    # Post identification
    platform_post_id = Column(String, nullable=False, unique=True, index=True)
    post_type = Column(String)  # photo, video, reel, story, etc.

    # Post content
    caption = Column(Text)
    media_url = Column(String)
    thumbnail_url = Column(String)
    permalink = Column(String)

    # Engagement metrics
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    saves = Column(Integer, default=0)
    views = Column(Integer, default=0)
    plays = Column(Integer, default=0)  # For video content

    # Engagement rates
    engagement_rate = Column(Float)  # Calculated: (likes + comments + shares) / followers
    view_rate = Column(Float)  # views / followers

    # Timing
    posted_at = Column(DateTime, nullable=False)
    scraped_at = Column(DateTime, default=datetime.utcnow)

    # Hashtags and mentions
    hashtags = Column(JSONB)  # ["music", "newrelease", ...]
    mentions = Column(JSONB)  # ["@fanpage", "@artist", ...]

    # Raw platform data
    raw_data = Column(JSONB)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    artist = relationship("Artist", back_populates="social_posts")
    platform_connection = relationship("PlatformConnection", back_populates="social_posts")

    def __repr__(self):
        return f"<SocialPost {self.platform_post_id} - Artist {self.artist_id}>"
