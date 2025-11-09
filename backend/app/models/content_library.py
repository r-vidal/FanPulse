"""
Content Library Model

Media library for storing uploaded images, videos, and other assets
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, Boolean, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class MediaType(str, enum.Enum):
    """Media type enum"""

    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"


class ContentLibraryItem(Base):
    """
    Content library item for media storage

    Stores uploaded media files with metadata and tagging
    """

    __tablename__ = "content_library_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("artists.id"), nullable=True)

    # File info
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_url = Column(String(1000), nullable=False)  # Cloudflare R2 or S3 URL
    thumbnail_url = Column(String(1000), nullable=True)  # Thumbnail for videos

    # Media metadata
    media_type = Column(SQLEnum(MediaType), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)  # bytes
    duration = Column(Integer, nullable=True)  # seconds (for video/audio)
    width = Column(Integer, nullable=True)  # pixels
    height = Column(Integer, nullable=True)  # pixels

    # Organization
    folder = Column(String(200), nullable=True)  # Folder path
    tags = Column(JSON, default=list)  # ["music", "promo", "behind-the-scenes"]
    description = Column(String(1000), nullable=True)

    # Usage tracking
    usage_count = Column(Integer, default=0, nullable=False)  # How many times used in posts
    last_used_at = Column(DateTime(timezone=True), nullable=True)

    # AI-generated metadata
    ai_tags = Column(JSON, default=list)  # AI-detected tags
    ai_description = Column(String(1000), nullable=True)  # AI-generated description
    ai_metadata = Column(JSON, default=dict)  # Other AI analysis

    # Audit
    uploaded_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="content_library_items")
    artist = relationship("Artist")

    def __repr__(self):
        return f"<ContentLibraryItem {self.id} - {self.original_filename}>"


# Add to User model relationship
from app.models.user import User

if not hasattr(User, "content_library_items"):
    User.content_library_items = relationship(
        "ContentLibraryItem", back_populates="user", cascade="all, delete-orphan"
    )
