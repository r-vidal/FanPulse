"""White-Label Client Reports Routes"""
import logging
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, validator
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.artist import Artist
from app.models.report import (
    BrandingSettings, ReportTemplate, GeneratedReport, ReportShare,
    ReportFormat, ReportPeriod, ReportStatus, DeliveryMethod
)
from app.services.report_generator import get_report_generator

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================================
# Pydantic Schemas
# ============================================================================

class BrandingSettingsUpdate(BaseModel):
    """Update branding settings"""
    company_name: Optional[str] = Field(None, max_length=100)
    company_tagline: Optional[str] = Field(None, max_length=200)
    logo_url: Optional[str] = Field(None, max_length=500)
    website_url: Optional[str] = Field(None, max_length=200)
    primary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    secondary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    accent_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    footer_text: Optional[str] = None


class BrandingSettingsResponse(BaseModel):
    """Branding settings response"""
    id: UUID
    company_name: str
    company_tagline: Optional[str]
    logo_url: Optional[str]
    primary_color: str
    secondary_color: str
    accent_color: str
    contact_email: Optional[str]
    footer_text: Optional[str]

    class Config:
        from_attributes = True


class ReportTemplateCreate(BaseModel):
    """Create report template"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    format: ReportFormat = ReportFormat.PDF
    period: ReportPeriod = ReportPeriod.MONTHLY
    include_streaming_stats: bool = True
    include_social_stats: bool = True
    include_revenue_forecast: bool = True
    include_momentum_score: bool = True
    include_recommendations: bool = True
    is_scheduled: bool = False
    delivery_method: DeliveryMethod = DeliveryMethod.DOWNLOAD


class ReportTemplateResponse(BaseModel):
    """Report template response"""
    id: UUID
    name: str
    description: Optional[str]
    format: ReportFormat
    period: ReportPeriod
    include_streaming_stats: bool
    include_revenue_forecast: bool
    include_momentum_score: bool
    is_scheduled: bool
    created_at: datetime

    class Config:
        from_attributes = True


class GenerateReportRequest(BaseModel):
    """Request to generate a report"""
    artist_id: UUID
    template_id: Optional[UUID] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class GeneratedReportResponse(BaseModel):
    """Generated report response"""
    id: UUID
    title: str
    format: ReportFormat
    period: ReportPeriod
    status: ReportStatus
    start_date: datetime
    end_date: datetime
    pdf_file_path: Optional[str]
    html_file_path: Optional[str]
    created_at: datetime
    generation_time_seconds: Optional[int]

    class Config:
        from_attributes = True


# ============================================================================
# Branding Settings Routes
# ============================================================================

@router.post("/branding", response_model=BrandingSettingsResponse)
async def create_or_update_branding(
    branding_data: BrandingSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create or update branding settings

    Customize report branding with your company logo, colors, and contact info.
    """
    # Check if branding exists
    branding = db.query(BrandingSettings).filter(
        BrandingSettings.user_id == current_user.id
    ).first()

    if branding:
        # Update existing
        for field, value in branding_data.dict(exclude_unset=True).items():
            setattr(branding, field, value)
        branding.updated_at = datetime.utcnow()
    else:
        # Create new
        branding = BrandingSettings(
            user_id=current_user.id,
            company_name=branding_data.company_name or f"{current_user.email.split('@')[0].title()} Management",
            **branding_data.dict(exclude_unset=True, exclude={'company_name'})
        )
        db.add(branding)

    db.commit()
    db.refresh(branding)

    return BrandingSettingsResponse.from_orm(branding)


@router.get("/branding", response_model=BrandingSettingsResponse)
async def get_branding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get current branding settings

    Returns your customized branding configuration for reports.
    """
    branding = db.query(BrandingSettings).filter(
        BrandingSettings.user_id == current_user.id
    ).first()

    if not branding:
        # Create default branding
        branding = BrandingSettings(
            user_id=current_user.id,
            company_name=f"{current_user.email.split('@')[0].title()} Management",
            primary_color="#1DB954",
            secondary_color="#191414",
            accent_color="#1ED760",
        )
        db.add(branding)
        db.commit()
        db.refresh(branding)

    return BrandingSettingsResponse.from_orm(branding)


# ============================================================================
# Report Templates Routes
# ============================================================================

@router.post("/templates", response_model=ReportTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_report_template(
    template_data: ReportTemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new report template

    Define what data and sections to include in your reports.
    """
    template = ReportTemplate(
        user_id=current_user.id,
        **template_data.dict()
    )

    db.add(template)
    db.commit()
    db.refresh(template)

    return ReportTemplateResponse.from_orm(template)


@router.get("/templates", response_model=List[ReportTemplateResponse])
async def list_report_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all report templates

    Returns all your saved report templates.
    """
    templates = db.query(ReportTemplate).filter(
        ReportTemplate.user_id == current_user.id
    ).order_by(ReportTemplate.created_at.desc()).all()

    return [ReportTemplateResponse.from_orm(t) for t in templates]


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report_template(
    template_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a report template"""
    template = db.query(ReportTemplate).filter(
        ReportTemplate.id == template_id,
        ReportTemplate.user_id == current_user.id,
    ).first()

    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    db.delete(template)
    db.commit()


# ============================================================================
# Report Generation Routes
# ============================================================================

@router.post("/generate", response_model=GeneratedReportResponse, status_code=status.HTTP_201_CREATED)
async def generate_report(
    request: GenerateReportRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate a new report

    Creates a white-label PDF/HTML report for the specified artist.
    Generation happens asynchronously - check status with GET /reports/{id}.
    """
    # Verify artist ownership
    artist = db.query(Artist).filter(
        Artist.id == request.artist_id,
        Artist.user_id == current_user.id,
    ).first()

    if not artist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found")

    # Verify template ownership if provided
    if request.template_id:
        template = db.query(ReportTemplate).filter(
            ReportTemplate.id == request.template_id,
            ReportTemplate.user_id == current_user.id,
        ).first()

        if not template:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    # Generate report
    try:
        generator = get_report_generator(db)
        report = generator.generate_report(
            user_id=str(current_user.id),
            artist_id=str(request.artist_id),
            template_id=str(request.template_id) if request.template_id else None,
            start_date=request.start_date,
            end_date=request.end_date,
        )

        return GeneratedReportResponse.from_orm(report)

    except Exception as e:
        logger.error(f"Failed to generate report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}"
        )


@router.get("", response_model=List[GeneratedReportResponse])
async def list_reports(
    artist_id: Optional[UUID] = Query(None, description="Filter by artist"),
    status_filter: Optional[ReportStatus] = Query(None, alias="status", description="Filter by status"),
    limit: int = Query(default=50, le=100, description="Max results"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List generated reports

    Returns all reports you've generated, with optional filtering.
    """
    query = db.query(GeneratedReport).filter(
        GeneratedReport.user_id == current_user.id
    )

    if artist_id:
        query = query.filter(GeneratedReport.artist_id == artist_id)

    if status_filter:
        query = query.filter(GeneratedReport.status == status_filter)

    reports = query.order_by(GeneratedReport.created_at.desc()).limit(limit).all()

    return [GeneratedReportResponse.from_orm(r) for r in reports]


@router.get("/{report_id}", response_model=GeneratedReportResponse)
async def get_report(
    report_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get report details

    Returns metadata and status for a specific report.
    """
    report = db.query(GeneratedReport).filter(
        GeneratedReport.id == report_id,
        GeneratedReport.user_id == current_user.id,
    ).first()

    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    return GeneratedReportResponse.from_orm(report)


@router.get("/{report_id}/download")
async def download_report(
    report_id: UUID,
    format: ReportFormat = Query(default=ReportFormat.PDF, description="Download format"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Download report file

    Returns the PDF or HTML file for the report.
    """
    report = db.query(GeneratedReport).filter(
        GeneratedReport.id == report_id,
        GeneratedReport.user_id == current_user.id,
    ).first()

    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    if report.status != ReportStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Report not ready. Current status: {report.status}"
        )

    # Get file path
    if format == ReportFormat.PDF:
        file_path = report.pdf_file_path
        media_type = "application/pdf"
        filename = f"report_{report.id}.pdf"
    else:
        file_path = report.html_file_path
        media_type = "text/html"
        filename = f"report_{report.id}.html"

    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{format} file not available for this report"
        )

    # Update download count
    report.download_count += 1
    report.last_downloaded_at = datetime.utcnow()
    db.commit()

    return FileResponse(
        file_path,
        media_type=media_type,
        filename=filename,
    )


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a report

    Removes the report record and associated files.
    """
    report = db.query(GeneratedReport).filter(
        GeneratedReport.id == report_id,
        GeneratedReport.user_id == current_user.id,
    ).first()

    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    # Delete files
    import os
    if report.pdf_file_path and os.path.exists(report.pdf_file_path):
        os.remove(report.pdf_file_path)
    if report.html_file_path and os.path.exists(report.html_file_path):
        os.remove(report.html_file_path)

    db.delete(report)
    db.commit()
