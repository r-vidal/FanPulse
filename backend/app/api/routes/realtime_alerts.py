"""REST API Routes for Real-time Alerts Management"""
import logging
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.alert import Alert, AlertType, AlertSeverity
from app.services.opportunity_detector import get_opportunity_detector

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================================
# Pydantic Schemas
# ============================================================================

class OpportunityResponse(BaseModel):
    """Opportunity detection response"""
    type: str
    artist_id: str
    artist_name: str
    priority: str
    title: str
    message: str
    data: dict
    actions: List[str]


class AlertResponse(BaseModel):
    """Alert response"""
    id: UUID
    alert_type: AlertType
    severity: AlertSeverity
    message: str
    data: dict
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AlertStats(BaseModel):
    """Alert statistics"""
    total_alerts: int
    unread_alerts: int
    alerts_by_priority: dict
    alerts_by_type: dict
    recent_alerts: List[AlertResponse]


# ============================================================================
# Routes
# ============================================================================

@router.get("/opportunities", response_model=List[OpportunityResponse])
async def scan_current_opportunities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Scan for current opportunities across all artists

    Performs real-time analysis to detect:
    - Viral growth patterns
    - Momentum spikes
    - Plateau breakouts
    - Optimal release windows
    - Approaching milestones

    Returns immediate opportunities without storing them.
    """
    try:
        detector = get_opportunity_detector(db)
        opportunities = detector.detect_all_opportunities(str(current_user.id))

        return opportunities

    except Exception as e:
        logger.error(f"Error scanning opportunities: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to scan opportunities"
        )


@router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(
    unread_only: bool = Query(default=False, description="Show only unread alerts"),
    priority: Optional[AlertPriority] = Query(default=None, description="Filter by priority"),
    limit: int = Query(default=50, le=200, description="Maximum alerts to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get alert history

    Returns stored alerts with optional filtering.
    """
    query = db.query(Alert).filter(Alert.user_id == current_user.id)

    if unread_only:
        query = query.filter(Alert.resolved_at == None)

    if priority:
        query = query.filter(Alert.severity == priority)

    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()

    return [AlertResponse.from_orm(alert) for alert in alerts]


@router.get("/alerts/stats", response_model=AlertStats)
async def get_alert_stats(
    days: int = Query(default=30, ge=1, le=90, description="Days to analyze"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get alert statistics

    Returns summary statistics about alerts for the specified period.
    """
    since = datetime.utcnow() - timedelta(days=days)

    # Get all alerts in period
    alerts = db.query(Alert).filter(
        Alert.user_id == current_user.id,
        Alert.created_at >= since,
    ).all()

    # Calculate statistics
    total_alerts = len(alerts)
    unread_alerts = sum(1 for a in alerts if a.resolved_at is None)

    # Group by severity
    alerts_by_priority = {}
    for severity in AlertSeverity:
        count = sum(1 for a in alerts if a.severity == severity)
        alerts_by_priority[severity.value] = count

    # Group by type
    alerts_by_type = {}
    for alert_type in AlertType:
        count = sum(1 for a in alerts if a.alert_type == alert_type)
        alerts_by_type[alert_type.value] = count

    # Get recent alerts
    recent = sorted(alerts, key=lambda a: a.created_at, reverse=True)[:10]

    return AlertStats(
        total_alerts=total_alerts,
        unread_alerts=unread_alerts,
        alerts_by_priority=alerts_by_priority,
        alerts_by_type=alerts_by_type,
        recent_alerts=[AlertResponse.from_orm(a) for a in recent],
    )


@router.put("/alerts/{alert_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_alert_as_read(
    alert_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mark an alert as read

    Updates the alert's read status.
    """
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.user_id == current_user.id,
    ).first()

    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )

    alert.resolved_at = datetime.utcnow()
    db.commit()


@router.put("/alerts/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_alerts_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mark all alerts as read

    Marks all unread alerts for the current user as read.
    """
    db.query(Alert).filter(
        Alert.user_id == current_user.id,
        Alert.resolved_at == None,
    ).update({
        "resolved_at": datetime.utcnow(),
    }, synchronize_session=False)

    db.commit()


@router.delete("/alerts/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete an alert

    Permanently removes an alert from history.
    """
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.user_id == current_user.id,
    ).first()

    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )

    db.delete(alert)
    db.commit()


@router.delete("/alerts", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_alerts(
    read_only: bool = Query(default=False, description="Delete only read alerts"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete multiple alerts

    Removes all or read-only alerts for the current user.
    """
    query = db.query(Alert).filter(Alert.user_id == current_user.id)

    if read_only:
        query = query.filter(Alert.resolved_at != None)

    query.delete(synchronize_session=False)
    db.commit()
