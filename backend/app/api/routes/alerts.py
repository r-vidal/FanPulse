"""Alert and notification API routes"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from app.core.database import get_db
from app.models.user import User
from app.models.artist import Artist
from app.models.alert import Alert
from app.models.alert_rule import AlertRule, AlertRuleType, Notification
from app.api.deps import get_current_user
from app.services.alerts.detector import AlertDetector
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/alerts", tags=["alerts"])


# Pydantic schemas
class AlertRuleCreate(BaseModel):
    artist_id: str
    rule_type: str
    name: str
    description: Optional[str] = None
    threshold_value: Optional[float] = None
    comparison_operator: Optional[str] = "gt"
    notify_email: bool = True
    notify_in_app: bool = True
    cooldown_hours: int = 24


class AlertRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    threshold_value: Optional[float] = None
    comparison_operator: Optional[str] = None
    is_active: Optional[bool] = None
    notify_email: Optional[bool] = None
    notify_in_app: Optional[bool] = None
    cooldown_hours: Optional[int] = None


class AlertRuleResponse(BaseModel):
    id: str
    artist_id: str
    rule_type: str
    name: str
    description: Optional[str]
    threshold_value: Optional[float]
    comparison_operator: Optional[str]
    is_active: bool
    notify_email: bool
    notify_in_app: bool
    cooldown_hours: int
    last_triggered_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class AlertResponse(BaseModel):
    id: str
    artist_id: str
    alert_type: str
    severity: str
    message: str
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: Optional[str]
    channel: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Helper function to verify artist ownership
def verify_artist_ownership(artist_id: str, user: User, db: Session) -> Artist:
    """Verify that the artist belongs to the current user"""
    artist = db.query(Artist).filter(
        Artist.id == artist_id,
        Artist.user_id == user.id,
    ).first()

    if not artist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found or access denied",
        )

    return artist


# Alert Rules
@router.post("/rules", response_model=AlertRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_alert_rule(
    rule_data: AlertRuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new alert rule

    Allows users to configure custom alerts for their artists
    """
    # Verify artist ownership
    artist = verify_artist_ownership(rule_data.artist_id, current_user, db)

    # Validate rule type
    try:
        rule_type_enum = AlertRuleType(rule_data.rule_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid rule type: {rule_data.rule_type}",
        )

    # Create rule
    rule = AlertRule(
        user_id=current_user.id,
        artist_id=rule_data.artist_id,
        rule_type=rule_type_enum,
        name=rule_data.name,
        description=rule_data.description,
        threshold_value=rule_data.threshold_value,
        comparison_operator=rule_data.comparison_operator,
        notify_email=rule_data.notify_email,
        notify_in_app=rule_data.notify_in_app,
        cooldown_hours=rule_data.cooldown_hours,
    )

    db.add(rule)
    db.commit()
    db.refresh(rule)

    return AlertRuleResponse(
        id=str(rule.id),
        artist_id=str(rule.artist_id),
        rule_type=rule.rule_type.value,
        name=rule.name,
        description=rule.description,
        threshold_value=rule.threshold_value,
        comparison_operator=rule.comparison_operator,
        is_active=rule.is_active,
        notify_email=rule.notify_email,
        notify_in_app=rule.notify_in_app,
        cooldown_hours=rule.cooldown_hours,
        last_triggered_at=rule.last_triggered_at,
        created_at=rule.created_at,
    )


@router.get("/rules", response_model=List[AlertRuleResponse])
async def list_alert_rules(
    artist_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all alert rules for the current user

    Optionally filter by artist_id
    """
    query = db.query(AlertRule).filter(AlertRule.user_id == current_user.id)

    if artist_id:
        # Verify ownership if filtering by artist
        verify_artist_ownership(artist_id, current_user, db)
        query = query.filter(AlertRule.artist_id == artist_id)

    rules = query.all()

    return [
        AlertRuleResponse(
            id=str(rule.id),
            artist_id=str(rule.artist_id),
            rule_type=rule.rule_type.value,
            name=rule.name,
            description=rule.description,
            threshold_value=rule.threshold_value,
            comparison_operator=rule.comparison_operator,
            is_active=rule.is_active,
            notify_email=rule.notify_email,
            notify_in_app=rule.notify_in_app,
            cooldown_hours=rule.cooldown_hours,
            last_triggered_at=rule.last_triggered_at,
            created_at=rule.created_at,
        )
        for rule in rules
    ]


@router.patch("/rules/{rule_id}", response_model=AlertRuleResponse)
async def update_alert_rule(
    rule_id: str,
    rule_data: AlertRuleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an alert rule"""
    rule = db.query(AlertRule).filter(
        AlertRule.id == rule_id,
        AlertRule.user_id == current_user.id,
    ).first()

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert rule not found",
        )

    # Update fields
    update_data = rule_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)

    db.commit()
    db.refresh(rule)

    return AlertRuleResponse(
        id=str(rule.id),
        artist_id=str(rule.artist_id),
        rule_type=rule.rule_type.value,
        name=rule.name,
        description=rule.description,
        threshold_value=rule.threshold_value,
        comparison_operator=rule.comparison_operator,
        is_active=rule.is_active,
        notify_email=rule.notify_email,
        notify_in_app=rule.notify_in_app,
        cooldown_hours=rule.cooldown_hours,
        last_triggered_at=rule.last_triggered_at,
        created_at=rule.created_at,
    )


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert_rule(
    rule_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an alert rule"""
    rule = db.query(AlertRule).filter(
        AlertRule.id == rule_id,
        AlertRule.user_id == current_user.id,
    ).first()

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert rule not found",
        )

    db.delete(rule)
    db.commit()

    return None


# Alerts
@router.get("/", response_model=List[AlertResponse])
async def list_alerts(
    artist_id: Optional[str] = Query(None),
    unresolved_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List alerts for the current user

    Filter by artist_id and/or unresolved status
    """
    query = db.query(Alert).filter(Alert.user_id == current_user.id)

    if artist_id:
        verify_artist_ownership(artist_id, current_user, db)
        query = query.filter(Alert.artist_id == artist_id)

    if unresolved_only:
        query = query.filter(Alert.resolved_at.is_(None))

    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()

    return [
        AlertResponse(
            id=str(alert.id),
            artist_id=str(alert.artist_id),
            alert_type=alert.alert_type.value,
            severity=alert.severity.value,
            message=alert.message,
            created_at=alert.created_at,
            resolved_at=alert.resolved_at,
        )
        for alert in alerts
    ]


@router.post("/check/{artist_id}")
async def check_alert_rules(
    artist_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Manually trigger alert rule checking for an artist

    Useful for testing or on-demand checks
    """
    artist = verify_artist_ownership(artist_id, current_user, db)

    detector = AlertDetector(db)
    new_alerts = detector.check_all_rules(artist_id)

    return {
        "artist_id": artist_id,
        "artist_name": artist.name,
        "alerts_triggered": len(new_alerts),
        "alerts": [
            {
                "id": str(alert.id),
                "type": alert.alert_type.value,
                "severity": alert.severity.value,
                "message": alert.message,
            }
            for alert in new_alerts
        ],
    }


@router.patch("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark an alert as resolved"""
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.user_id == current_user.id,
    ).first()

    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )

    alert.resolved_at = datetime.utcnow()
    db.commit()

    return {"message": "Alert resolved"}


# Notifications
@router.get("/notifications", response_model=List[NotificationResponse])
async def list_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List notifications for the current user

    Includes both alert notifications and other system notifications
    """
    query = db.query(Notification).filter(Notification.user_id == current_user.id)

    if unread_only:
        query = query.filter(Notification.is_read == False)

    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()

    return [
        NotificationResponse(
            id=str(n.id),
            title=n.title,
            message=n.message,
            type=n.type,
            channel=n.channel,
            is_read=n.is_read,
            created_at=n.created_at,
        )
        for n in notifications
    ]


@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.commit()

    return {"message": "Notification marked as read"}


@router.post("/notifications/mark-all-read")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all notifications as read"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True, "read_at": datetime.utcnow()})

    db.commit()

    return {"message": "All notifications marked as read"}
