"""White-Label Client Reports models"""
import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class ReportFormat(str, enum.Enum):
    """Report output format"""
    PDF = "pdf"
    HTML = "html"
    BOTH = "both"


class ReportPeriod(str, enum.Enum):
    """Report time period"""
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    CUSTOM = "custom"


class ReportStatus(str, enum.Enum):
    """Report generation status"""
    PENDING = "pending"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class DeliveryMethod(str, enum.Enum):
    """Report delivery method"""
    EMAIL = "email"
    DOWNLOAD = "download"
    BOTH = "both"


class BrandingSettings(Base):
    """
    Custom branding configuration for white-label reports

    Allows managers to customize reports with their own branding
    for professional client presentations.
    """
    __tablename__ = "branding_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Company branding
    company_name = Column(String(100), nullable=False)
    company_tagline = Column(String(200))
    logo_url = Column(String(500))  # URL or base64 encoded image
    website_url = Column(String(200))

    # Color scheme (hex colors)
    primary_color = Column(String(7), server_default="#1DB954")  # Spotify green default
    secondary_color = Column(String(7), server_default="#191414")  # Dark default
    accent_color = Column(String(7), server_default="#1ED760")
    text_color = Column(String(7), server_default="#000000")
    background_color = Column(String(7), server_default="#FFFFFF")

    # Contact information
    contact_email = Column(String(100))
    contact_phone = Column(String(20))
    contact_address = Column(String(200))

    # Social media links
    social_links = Column(JSON, default=dict)  # {"instagram": "@...", "twitter": "@..."}

    # Report preferences
    include_logo = Column(Boolean, server_default="true")
    include_contact_info = Column(Boolean, server_default="true")
    include_watermark = Column(Boolean, server_default="false")
    watermark_text = Column(String(50))

    # Custom footer text
    footer_text = Column(Text)  # e.g., "Powered by [Company Name]"

    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="branding_settings")

    def __repr__(self):
        return f"<BrandingSettings {self.company_name}>"


class ReportTemplate(Base):
    """
    Report template configuration

    Defines what data to include in reports and how to present it.
    """
    __tablename__ = "report_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Template info
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    is_default = Column(Boolean, server_default="false")

    # Report configuration
    format = Column(SQLEnum(ReportFormat), nullable=False, server_default="pdf")
    period = Column(SQLEnum(ReportPeriod), nullable=False, server_default="monthly")

    # Sections to include (customizable)
    sections = Column(JSON, default=list)  # ["overview", "streaming", "social", "revenue", "recommendations"]

    # Metrics to include
    include_streaming_stats = Column(Boolean, server_default="true")
    include_social_stats = Column(Boolean, server_default="true")
    include_revenue_forecast = Column(Boolean, server_default="true")
    include_momentum_score = Column(Boolean, server_default="true")
    include_recommendations = Column(Boolean, server_default="true")
    include_release_calendar = Column(Boolean, server_default="true")
    include_competitor_analysis = Column(Boolean, server_default="false")

    # Chart preferences
    chart_style = Column(String(20), server_default="modern")  # modern, minimal, classic
    show_charts = Column(Boolean, server_default="true")
    chart_colors = Column(JSON, default=list)  # Custom color palette

    # Scheduling
    is_scheduled = Column(Boolean, server_default="false")
    schedule_frequency = Column(String(20))  # "weekly", "monthly", "quarterly"
    schedule_day_of_week = Column(Integer)  # 0-6 (Monday-Sunday)
    schedule_day_of_month = Column(Integer)  # 1-31
    next_run_at = Column(DateTime)

    # Delivery
    delivery_method = Column(SQLEnum(DeliveryMethod), server_default="both")
    delivery_emails = Column(JSON, default=list)  # List of recipient emails

    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="report_templates")
    reports = relationship("GeneratedReport", back_populates="template", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ReportTemplate {self.name} ({self.format})>"


class GeneratedReport(Base):
    """
    Record of generated reports

    Stores metadata and file paths for all generated reports.
    """
    __tablename__ = "generated_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("artists.id", ondelete="CASCADE"), nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey("report_templates.id", ondelete="SET NULL"))

    # Report info
    title = Column(String(200), nullable=False)
    format = Column(SQLEnum(ReportFormat), nullable=False)
    period = Column(SQLEnum(ReportPeriod), nullable=False)

    # Time range
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)

    # Generation status
    status = Column(SQLEnum(ReportStatus), nullable=False, server_default="pending")
    error_message = Column(Text)

    # File storage
    pdf_file_path = Column(String(500))  # S3 URL or local path
    html_file_path = Column(String(500))
    pdf_file_size = Column(Integer)  # bytes
    html_file_size = Column(Integer)

    # Report metadata
    page_count = Column(Integer)
    generation_time_seconds = Column(Integer)
    data_snapshot = Column(JSON, default=dict)  # Store key metrics for quick access

    # Delivery tracking
    delivered_at = Column(DateTime)
    delivery_recipients = Column(JSON, default=list)  # Emails report was sent to
    download_count = Column(Integer, server_default="0")
    last_downloaded_at = Column(DateTime)

    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User")
    artist = relationship("Artist")
    template = relationship("ReportTemplate", back_populates="reports")

    def __repr__(self):
        return f"<GeneratedReport {self.title} ({self.format}) - {self.status}>"


class ReportShare(Base):
    """
    Shareable report links

    Allows users to generate public links to share reports with clients.
    """
    __tablename__ = "report_shares"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("generated_reports.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Share link
    share_token = Column(String(64), unique=True, nullable=False, index=True)  # Random token for URL
    public_url = Column(String(500), nullable=False)

    # Access control
    requires_password = Column(Boolean, server_default="false")
    password_hash = Column(String)
    expires_at = Column(DateTime)  # Optional expiration
    is_active = Column(Boolean, server_default="true")

    # Usage tracking
    view_count = Column(Integer, server_default="0")
    last_viewed_at = Column(DateTime)
    viewer_ips = Column(JSON, default=list)  # Track unique viewers

    # Permissions
    allow_download = Column(Boolean, server_default="true")
    allow_print = Column(Boolean, server_default="true")

    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    report = relationship("GeneratedReport")
    user = relationship("User")

    def __repr__(self):
        return f"<ReportShare {self.share_token[:8]}... ({self.view_count} views)>"
