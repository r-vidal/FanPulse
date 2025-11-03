from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.artist import Artist
from app.models.action import NextBestAction, ActionStatus, ActionUrgency
from app.services.action_engine import ActionEngine
from pydantic import BaseModel
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class ActionResponse(BaseModel):
    id: str
    artist_id: str
    artist_name: str
    action_type: str
    title: str
    description: str
    urgency: str
    reason: str | None
    expected_impact: str | None
    status: str
    created_at: datetime
    completed_at: datetime | None

    class Config:
        from_attributes = True


class ActionUpdateRequest(BaseModel):
    status: str  # "completed", "snoozed", "ignored"


@router.get("/artist/{artist_id}", response_model=List[ActionResponse])
async def get_actions_for_artist(
    artist_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all pending actions for a specific artist

    Generates fresh actions based on current data
    """
    # Verify artist belongs to user
    artist = db.query(Artist).filter(
        Artist.id == artist_id,
        Artist.user_id == current_user.id
    ).first()

    if not artist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

    # Generate actions
    engine = ActionEngine(db)
    try:
        actions = await engine.generate_actions_for_artist(
            artist_id=str(artist_id),
            user_id=str(current_user.id)
        )

        # Convert to response format
        return [
            ActionResponse(
                id=str(action.id) if action.id else "new",
                artist_id=str(action.artist_id),
                artist_name=artist.name,
                action_type=action.action_type,
                title=action.title,
                description=action.description,
                urgency=action.urgency.value,
                reason=action.reason,
                expected_impact=action.expected_impact,
                status=action.status.value,
                created_at=action.created_at,
                completed_at=action.completed_at
            )
            for action in actions
        ]

    except Exception as e:
        logger.error(f"Failed to generate actions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate actions: {str(e)}"
        )


@router.get("/next", response_model=ActionResponse | None)
async def get_next_action(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the single highest-priority action across all artists

    Returns the most urgent action that needs attention
    """
    # Get all user's artists
    artists = db.query(Artist).filter(Artist.user_id == current_user.id).all()

    if not artists:
        return None

    # Generate actions for all artists
    engine = ActionEngine(db)
    all_actions = []

    for artist in artists:
        try:
            actions = await engine.generate_actions_for_artist(
                artist_id=str(artist.id),
                user_id=str(current_user.id)
            )
            for action in actions:
                action.artist_name = artist.name  # Add artist name
                all_actions.append(action)
        except Exception as e:
            logger.error(f"Failed to generate actions for artist {artist.id}: {str(e)}")
            continue

    if not all_actions:
        return None

    # Sort by urgency and get top action
    urgency_order = {
        ActionUrgency.CRITICAL: 0,
        ActionUrgency.HIGH: 1,
        ActionUrgency.MEDIUM: 2,
        ActionUrgency.LOW: 3
    }
    all_actions.sort(key=lambda a: urgency_order[a.urgency])
    top_action = all_actions[0]

    return ActionResponse(
        id=str(top_action.id) if top_action.id else "new",
        artist_id=str(top_action.artist_id),
        artist_name=getattr(top_action, 'artist_name', 'Unknown'),
        action_type=top_action.action_type,
        title=top_action.title,
        description=top_action.description,
        urgency=top_action.urgency.value,
        reason=top_action.reason,
        expected_impact=top_action.expected_impact,
        status=top_action.status.value,
        created_at=top_action.created_at,
        completed_at=top_action.completed_at
    )


@router.post("/{action_id}/update", response_model=ActionResponse)
async def update_action_status(
    action_id: UUID,
    update: ActionUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an action's status (completed/snoozed/ignored)

    Note: V1 generates actions on-the-fly, so this endpoint
    is a placeholder for future persistent actions
    """
    # For V1, we just return success
    # In V2, we'll persist actions to database and track completion
    return ActionResponse(
        id=str(action_id),
        artist_id="00000000-0000-0000-0000-000000000000",
        artist_name="Unknown",
        action_type="unknown",
        title="Action Updated",
        description="Status updated successfully",
        urgency="low",
        reason=None,
        expected_impact=None,
        status=update.status,
        created_at=datetime.utcnow(),
        completed_at=datetime.utcnow() if update.status == "completed" else None
    )
