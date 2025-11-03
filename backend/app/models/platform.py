from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.core.database import Base


class PlatformType(str, enum.Enum):
    SPOTIFY = "spotify"
    APPLE_MUSIC = "apple_music"
    YOUTUBE = "youtube"
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    TWITTER = "twitter"


class PlatformConnection(Base):
    """
    Represents a connection between an Artist and a streaming/social platform
    """
    __tablename__ = "platform_connections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("artists.id"), nullable=False)
    platform_type = Column(Enum(PlatformType, values_callable=lambda x: [e.value for e in x]), nullable=False)

    # Platform-specific IDs
    platform_artist_id = Column(String, nullable=False)  # e.g., Spotify artist ID
    platform_username = Column(String)  # e.g., Instagram username

    # OAuth tokens (encrypted in production)
    access_token = Column(String)
    refresh_token = Column(String)
    token_expires_at = Column(DateTime)

    # Connection metadata
    is_active = Column(Boolean, default=True, nullable=False)
    last_synced_at = Column(DateTime)
    sync_error = Column(String)

    # Platform-specific data (stored as JSON)
    platform_data = Column(JSON)  # Store raw platform data

    # Timestamps
    connected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    artist = relationship("Artist", back_populates="platform_connections")
    stream_history = relationship(
        "StreamHistory",
        back_populates="platform_connection",
        cascade="all, delete-orphan"
    )
    social_posts = relationship(
        "SocialPost",
        back_populates="platform_connection",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<PlatformConnection {self.platform_type} for Artist {self.artist_id}>"
