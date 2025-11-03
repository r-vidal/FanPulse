from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base


class Artist(Base):
    __tablename__ = "artists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    spotify_id = Column(String, unique=True, index=True)
    instagram_id = Column(String, index=True)
    youtube_id = Column(String, index=True)
    name = Column(String, nullable=False)
    genre = Column(String)
    image_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="artists")
    superfans = relationship("Superfan", back_populates="artist", cascade="all, delete-orphan")
    streams = relationship("Stream", back_populates="artist", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="artist", cascade="all, delete-orphan")
    alert_rules = relationship("AlertRule", back_populates="artist", cascade="all, delete-orphan")
    platform_connections = relationship("PlatformConnection", back_populates="artist", cascade="all, delete-orphan")
    stream_history = relationship("StreamHistory", back_populates="artist", cascade="all, delete-orphan")
    social_posts = relationship("SocialPost", back_populates="artist", cascade="all, delete-orphan")
