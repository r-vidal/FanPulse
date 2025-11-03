"""API Key models for external API access"""
import enum
import uuid
from datetime import datetime, timedelta
from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class RateLimitTier(str, enum.Enum):
    """Rate limit tiers based on subscription"""
    SOLO = "solo"           # 100 requests/hour
    PRO = "pro"             # 1,000 requests/hour
    LABEL = "label"         # 10,000 requests/hour
    ENTERPRISE = "enterprise"  # 100,000 requests/hour


class APIKeyStatus(str, enum.Enum):
    """API key status"""
    ACTIVE = "active"
    REVOKED = "revoked"
    EXPIRED = "expired"


class APIKey(Base):
    """
    API Key for external access to FanPulse API

    Allows users to programmatically access their data via REST API.
    Includes rate limiting, usage tracking, and expiration management.
    """
    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Key identification
    name = Column(String, nullable=False)  # User-friendly name (e.g., "Production Server")
    description = Column(String)

    # The actual API key (hashed in production)
    key_hash = Column(String, nullable=False, unique=True, index=True)
    key_prefix = Column(String(8), nullable=False)  # First 8 chars for identification (e.g., "fp_live_")

    # Rate limiting
    rate_limit_tier = Column(SQLEnum(RateLimitTier), nullable=False, default=RateLimitTier.SOLO)
    requests_per_hour = Column(Integer, nullable=False)  # Cached limit for fast checks

    # Usage tracking
    total_requests = Column(Integer, default=0, nullable=False)
    last_used_at = Column(DateTime)
    current_hour_requests = Column(Integer, default=0, nullable=False)
    current_hour_start = Column(DateTime)

    # Status and expiration
    status = Column(SQLEnum(APIKeyStatus), nullable=False, default=APIKeyStatus.ACTIVE)
    expires_at = Column(DateTime)  # Optional expiration

    # Permissions and scopes (future-proof)
    scopes = Column(JSON, default=list)  # e.g., ["read:artists", "write:releases"]
    allowed_ips = Column(JSON, default=list)  # Optional IP whitelist

    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    revoked_at = Column(DateTime)
    revoked_reason = Column(String)

    # Relationships
    user = relationship("User", back_populates="api_keys")
    usage_logs = relationship("APIKeyUsageLog", back_populates="api_key", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<APIKey {self.key_prefix}... ({self.name})>"

    @property
    def is_valid(self) -> bool:
        """Check if key is valid and not expired"""
        if self.status != APIKeyStatus.ACTIVE:
            return False

        if self.expires_at and self.expires_at < datetime.utcnow():
            return False

        return True

    @property
    def is_rate_limited(self) -> bool:
        """Check if key has exceeded rate limit for current hour"""
        if not self.current_hour_start:
            return False

        # Reset counter if we're in a new hour
        if datetime.utcnow() - self.current_hour_start > timedelta(hours=1):
            return False

        return self.current_hour_requests >= self.requests_per_hour


class APIKeyUsageLog(Base):
    """
    Detailed usage logs for API keys

    Tracks every API request for analytics, debugging, and billing purposes.
    Logs are automatically cleaned up after 30 days to save space.
    """
    __tablename__ = "api_key_usage_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id", ondelete="CASCADE"), nullable=False)

    # Request details
    endpoint = Column(String, nullable=False)  # e.g., "/api/artists/123/analytics"
    method = Column(String(10), nullable=False)  # GET, POST, PUT, DELETE
    status_code = Column(Integer, nullable=False)  # 200, 400, 429, etc.

    # Performance metrics
    response_time_ms = Column(Integer)  # Response time in milliseconds

    # Request metadata
    ip_address = Column(String(45))  # IPv4 or IPv6
    user_agent = Column(String)

    # Cost tracking (for future billing)
    compute_units = Column(Integer, default=1)  # Weight different endpoints differently

    # Timestamp
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    # Relationships
    api_key = relationship("APIKey", back_populates="usage_logs")

    def __repr__(self):
        return f"<APIKeyUsageLog {self.method} {self.endpoint} ({self.status_code})>"


class APIKeyUsageSummary(Base):
    """
    Aggregated usage statistics by day

    Pre-computed daily summaries for fast analytics and charts.
    Automatically calculated via background task.
    """
    __tablename__ = "api_key_usage_summaries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Summary date
    date = Column(DateTime, nullable=False, index=True)  # Start of day (00:00:00)

    # Request counts
    total_requests = Column(Integer, default=0, nullable=False)
    successful_requests = Column(Integer, default=0, nullable=False)  # 2xx status codes
    failed_requests = Column(Integer, default=0, nullable=False)  # 4xx, 5xx
    rate_limited_requests = Column(Integer, default=0, nullable=False)  # 429 status

    # Performance metrics
    avg_response_time_ms = Column(Integer)
    p95_response_time_ms = Column(Integer)  # 95th percentile

    # Most used endpoints (top 5)
    top_endpoints = Column(JSON, default=list)  # [{"endpoint": "/api/...", "count": 123}, ...]

    # Total compute units (for billing)
    total_compute_units = Column(Integer, default=0, nullable=False)

    # Timestamp
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    api_key = relationship("APIKey")
    user = relationship("User")

    def __repr__(self):
        return f"<APIKeyUsageSummary {self.date.date()} - {self.total_requests} requests>"
