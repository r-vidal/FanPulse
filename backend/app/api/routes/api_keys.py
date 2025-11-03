"""API Key Management Routes"""
import logging
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.api_key import APIKey, APIKeyStatus, RateLimitTier
from app.services.api_key_manager import api_key_manager

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================================
# Pydantic Schemas
# ============================================================================

class APIKeyCreate(BaseModel):
    """Request to create new API key"""
    name: str = Field(..., min_length=1, max_length=100, description="Friendly name for the key")
    description: Optional[str] = Field(None, max_length=500, description="Optional description")
    expires_in_days: Optional[int] = Field(None, gt=0, le=3650, description="Expiration in days (max 10 years)")
    scopes: Optional[List[str]] = Field(default=[], description="Permission scopes (future use)")


class APIKeyResponse(BaseModel):
    """API key response (without the actual key)"""
    id: UUID
    name: str
    description: Optional[str]
    key_prefix: str
    rate_limit_tier: RateLimitTier
    requests_per_hour: int
    total_requests: int
    last_used_at: Optional[datetime]
    status: APIKeyStatus
    expires_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class APIKeyCreateResponse(BaseModel):
    """Response when creating a new key (includes the actual key ONCE)"""
    api_key: str = Field(..., description="The actual API key - save this! It won't be shown again.")
    key_info: APIKeyResponse

    class Config:
        from_attributes = True


class APIKeyUsageStats(BaseModel):
    """Usage statistics for an API key"""
    period_days: int
    total_requests: int
    successful_requests: int
    failed_requests: int
    rate_limited_requests: int
    avg_response_time_ms: int
    top_endpoints: List[dict]


class RateLimitInfo(BaseModel):
    """Rate limit information"""
    tier: RateLimitTier
    requests_per_hour: int
    current_hour_requests: int
    remaining: int


# ============================================================================
# Routes
# ============================================================================

@router.post("", response_model=APIKeyCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    key_data: APIKeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new API key

    **Important**: The API key will only be shown once. Save it securely!

    The rate limit tier is automatically determined by your subscription:
    - SOLO: 100 requests/hour
    - PRO: 1,000 requests/hour
    - LABEL: 10,000 requests/hour
    - ENTERPRISE: 100,000 requests/hour
    """
    try:
        # Check if user has reached key limit (max 10 keys per user)
        existing_keys = api_key_manager.get_user_keys(db, str(current_user.id))
        active_keys = [k for k in existing_keys if k.status == APIKeyStatus.ACTIVE]

        if len(active_keys) >= 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum of 10 active API keys allowed. Please revoke unused keys.",
            )

        # Create key
        api_key, full_key = api_key_manager.create_api_key(
            db=db,
            user_id=str(current_user.id),
            name=key_data.name,
            description=key_data.description,
            expires_in_days=key_data.expires_in_days,
            scopes=key_data.scopes,
        )

        return APIKeyCreateResponse(
            api_key=full_key,
            key_info=APIKeyResponse.from_orm(api_key),
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating API key: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create API key")


@router.get("", response_model=List[APIKeyResponse])
async def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all API keys for current user

    Returns all keys (active, revoked, expired) with usage statistics.
    """
    keys = api_key_manager.get_user_keys(db, str(current_user.id))
    return [APIKeyResponse.from_orm(key) for key in keys]


@router.get("/{key_id}", response_model=APIKeyResponse)
async def get_api_key(
    key_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get details for a specific API key

    Only returns keys owned by the current user.
    """
    api_key = db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.user_id == current_user.id,
    ).first()

    if not api_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")

    return APIKeyResponse.from_orm(api_key)


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    key_id: UUID,
    reason: Optional[str] = Query(None, max_length=200, description="Reason for revocation"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Revoke an API key

    Once revoked, the key can no longer be used. This action cannot be undone.
    """
    # Verify ownership
    api_key = db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.user_id == current_user.id,
    ).first()

    if not api_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")

    if api_key.status == APIKeyStatus.REVOKED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="API key already revoked")

    # Revoke key
    try:
        api_key_manager.revoke_key(db, str(key_id), reason)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error revoking API key: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to revoke API key")


@router.get("/{key_id}/usage", response_model=APIKeyUsageStats)
async def get_api_key_usage(
    key_id: UUID,
    days: int = Query(default=30, ge=1, le=365, description="Number of days to look back"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get usage statistics for an API key

    Returns request counts, success rates, response times, and top endpoints
    for the specified time period.
    """
    # Verify ownership
    api_key = db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.user_id == current_user.id,
    ).first()

    if not api_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")

    # Get stats
    try:
        stats = api_key_manager.get_usage_stats(db, str(key_id), days)
        return APIKeyUsageStats(**stats)
    except Exception as e:
        logger.error(f"Error getting API key usage: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get usage stats")


@router.get("/{key_id}/rate-limit", response_model=RateLimitInfo)
async def get_rate_limit_info(
    key_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get current rate limit status for an API key

    Shows current hour's usage and remaining requests.
    """
    # Verify ownership
    api_key = db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.user_id == current_user.id,
    ).first()

    if not api_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")

    remaining = max(0, api_key.requests_per_hour - api_key.current_hour_requests)

    return RateLimitInfo(
        tier=api_key.rate_limit_tier,
        requests_per_hour=api_key.requests_per_hour,
        current_hour_requests=api_key.current_hour_requests,
        remaining=remaining,
    )
