"""API Key Management Service"""
import secrets
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.api_key import APIKey, APIKeyStatus, RateLimitTier, APIKeyUsageLog, APIKeyUsageSummary
from app.models.user import User, SubscriptionTier

logger = logging.getLogger(__name__)


class APIKeyManager:
    """
    Manages API key lifecycle and usage

    Handles generation, validation, rate limiting, and usage tracking
    for external API access.
    """

    # Rate limits by tier (requests per hour)
    RATE_LIMITS = {
        RateLimitTier.SOLO: 100,
        RateLimitTier.PRO: 1_000,
        RateLimitTier.LABEL: 10_000,
        RateLimitTier.ENTERPRISE: 100_000,
    }

    # Subscription tier to rate limit tier mapping
    TIER_MAPPING = {
        SubscriptionTier.SOLO: RateLimitTier.SOLO,
        SubscriptionTier.PRO: RateLimitTier.PRO,
        SubscriptionTier.LABEL: RateLimitTier.LABEL,
        SubscriptionTier.ENTERPRISE: RateLimitTier.ENTERPRISE,
    }

    @staticmethod
    def generate_key() -> tuple[str, str, str]:
        """
        Generate a new API key

        Returns:
            Tuple of (full_key, key_hash, prefix)
            - full_key: The actual key to show user (store securely!)
            - key_hash: Hashed version to store in database
            - prefix: First 8 chars for identification (e.g., "fp_live_")
        """
        # Generate random key (32 bytes = 64 hex chars)
        random_part = secrets.token_hex(32)

        # Add prefix for identification
        prefix = "fp_live_"
        full_key = f"{prefix}{random_part}"

        # Hash the key for storage (SHA-256)
        key_hash = hashlib.sha256(full_key.encode()).hexdigest()

        return full_key, key_hash, prefix

    @staticmethod
    def hash_key(api_key: str) -> str:
        """Hash an API key for storage/comparison"""
        return hashlib.sha256(api_key.encode()).hexdigest()

    def create_api_key(
        self,
        db: Session,
        user_id: str,
        name: str,
        description: Optional[str] = None,
        expires_in_days: Optional[int] = None,
        scopes: Optional[List[str]] = None,
    ) -> tuple[APIKey, str]:
        """
        Create a new API key for a user

        Args:
            db: Database session
            user_id: User UUID
            name: Key name (e.g., "Production Server")
            description: Optional description
            expires_in_days: Optional expiration (e.g., 365 for 1 year)
            scopes: Optional list of permission scopes

        Returns:
            Tuple of (APIKey model, full_key_string)
            The full_key_string should be shown to user once and never stored!
        """
        # Get user to determine rate limit tier
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Determine rate limit tier from subscription
        rate_limit_tier = self.TIER_MAPPING.get(user.subscription_tier, RateLimitTier.SOLO)
        requests_per_hour = self.RATE_LIMITS[rate_limit_tier]

        # Generate key
        full_key, key_hash, prefix = self.generate_key()

        # Calculate expiration
        expires_at = None
        if expires_in_days:
            expires_at = datetime.utcnow() + timedelta(days=expires_in_days)

        # Create API key model
        api_key = APIKey(
            user_id=user_id,
            name=name,
            description=description,
            key_hash=key_hash,
            key_prefix=prefix,
            rate_limit_tier=rate_limit_tier,
            requests_per_hour=requests_per_hour,
            expires_at=expires_at,
            scopes=scopes or [],
            status=APIKeyStatus.ACTIVE,
        )

        db.add(api_key)
        db.commit()
        db.refresh(api_key)

        logger.info(f"Created API key '{name}' for user {user_id}")

        return api_key, full_key

    def validate_key(self, db: Session, api_key: str) -> Optional[APIKey]:
        """
        Validate an API key

        Args:
            db: Database session
            api_key: The full API key string

        Returns:
            APIKey model if valid, None otherwise
        """
        # Hash the provided key
        key_hash = self.hash_key(api_key)

        # Find key in database
        api_key_obj = db.query(APIKey).filter(APIKey.key_hash == key_hash).first()

        if not api_key_obj:
            logger.warning(f"Invalid API key attempt: {api_key[:16]}...")
            return None

        # Check if key is valid
        if not api_key_obj.is_valid:
            logger.warning(
                f"Attempted use of invalid API key: {api_key_obj.name} "
                f"(status: {api_key_obj.status})"
            )
            return None

        return api_key_obj

    def check_rate_limit(self, db: Session, api_key: APIKey) -> tuple[bool, Dict]:
        """
        Check if API key has exceeded rate limit

        Args:
            db: Database session
            api_key: APIKey model

        Returns:
            Tuple of (allowed: bool, info: dict)
            - allowed: True if request should be allowed
            - info: Dict with rate limit details for headers
        """
        now = datetime.utcnow()

        # Initialize rate limit tracking if needed
        if not api_key.current_hour_start or now - api_key.current_hour_start > timedelta(hours=1):
            # Reset for new hour
            api_key.current_hour_start = now
            api_key.current_hour_requests = 0
            db.commit()

        # Check limit
        allowed = api_key.current_hour_requests < api_key.requests_per_hour

        # Calculate reset time (start of next hour)
        reset_time = api_key.current_hour_start + timedelta(hours=1)
        seconds_until_reset = int((reset_time - now).total_seconds())

        info = {
            "limit": api_key.requests_per_hour,
            "remaining": max(0, api_key.requests_per_hour - api_key.current_hour_requests),
            "reset": int(reset_time.timestamp()),
            "reset_in_seconds": seconds_until_reset,
        }

        return allowed, info

    def increment_usage(self, db: Session, api_key: APIKey) -> None:
        """
        Increment usage counters for an API key

        Args:
            db: Database session
            api_key: APIKey model
        """
        api_key.total_requests += 1
        api_key.current_hour_requests += 1
        api_key.last_used_at = datetime.utcnow()
        db.commit()

    def log_request(
        self,
        db: Session,
        api_key_id: str,
        endpoint: str,
        method: str,
        status_code: int,
        response_time_ms: int,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        compute_units: int = 1,
    ) -> APIKeyUsageLog:
        """
        Log an API request for analytics and billing

        Args:
            db: Database session
            api_key_id: UUID of API key
            endpoint: Request endpoint (e.g., "/api/artists/123")
            method: HTTP method (GET, POST, etc.)
            status_code: HTTP status code
            response_time_ms: Response time in milliseconds
            ip_address: Client IP address
            user_agent: Client user agent
            compute_units: Weight for billing (default 1)

        Returns:
            APIKeyUsageLog model
        """
        log = APIKeyUsageLog(
            api_key_id=api_key_id,
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            response_time_ms=response_time_ms,
            ip_address=ip_address,
            user_agent=user_agent,
            compute_units=compute_units,
        )

        db.add(log)
        db.commit()

        return log

    def revoke_key(self, db: Session, api_key_id: str, reason: Optional[str] = None) -> APIKey:
        """
        Revoke an API key

        Args:
            db: Database session
            api_key_id: UUID of API key
            reason: Optional reason for revocation

        Returns:
            Updated APIKey model
        """
        api_key = db.query(APIKey).filter(APIKey.id == api_key_id).first()
        if not api_key:
            raise ValueError("API key not found")

        api_key.status = APIKeyStatus.REVOKED
        api_key.revoked_at = datetime.utcnow()
        api_key.revoked_reason = reason

        db.commit()
        db.refresh(api_key)

        logger.info(f"Revoked API key '{api_key.name}' (reason: {reason})")

        return api_key

    def get_user_keys(self, db: Session, user_id: str) -> List[APIKey]:
        """
        Get all API keys for a user

        Args:
            db: Database session
            user_id: User UUID

        Returns:
            List of APIKey models
        """
        return db.query(APIKey).filter(APIKey.user_id == user_id).order_by(APIKey.created_at.desc()).all()

    def get_usage_stats(
        self,
        db: Session,
        api_key_id: str,
        days: int = 30
    ) -> Dict:
        """
        Get usage statistics for an API key

        Args:
            db: Database session
            api_key_id: UUID of API key
            days: Number of days to look back (default 30)

        Returns:
            Dict with usage statistics
        """
        since = datetime.utcnow() - timedelta(days=days)

        # Get total requests
        total_requests = db.query(func.count(APIKeyUsageLog.id)).filter(
            APIKeyUsageLog.api_key_id == api_key_id,
            APIKeyUsageLog.timestamp >= since,
        ).scalar()

        # Get successful requests (2xx status codes)
        successful_requests = db.query(func.count(APIKeyUsageLog.id)).filter(
            APIKeyUsageLog.api_key_id == api_key_id,
            APIKeyUsageLog.timestamp >= since,
            APIKeyUsageLog.status_code >= 200,
            APIKeyUsageLog.status_code < 300,
        ).scalar()

        # Get rate limited requests (429 status)
        rate_limited_requests = db.query(func.count(APIKeyUsageLog.id)).filter(
            APIKeyUsageLog.api_key_id == api_key_id,
            APIKeyUsageLog.timestamp >= since,
            APIKeyUsageLog.status_code == 429,
        ).scalar()

        # Get average response time
        avg_response_time = db.query(func.avg(APIKeyUsageLog.response_time_ms)).filter(
            APIKeyUsageLog.api_key_id == api_key_id,
            APIKeyUsageLog.timestamp >= since,
        ).scalar()

        # Get top endpoints
        top_endpoints = db.query(
            APIKeyUsageLog.endpoint,
            func.count(APIKeyUsageLog.id).label("count")
        ).filter(
            APIKeyUsageLog.api_key_id == api_key_id,
            APIKeyUsageLog.timestamp >= since,
        ).group_by(
            APIKeyUsageLog.endpoint
        ).order_by(
            func.count(APIKeyUsageLog.id).desc()
        ).limit(5).all()

        return {
            "period_days": days,
            "total_requests": total_requests or 0,
            "successful_requests": successful_requests or 0,
            "failed_requests": (total_requests or 0) - (successful_requests or 0),
            "rate_limited_requests": rate_limited_requests or 0,
            "avg_response_time_ms": int(avg_response_time) if avg_response_time else 0,
            "top_endpoints": [
                {"endpoint": endpoint, "count": count}
                for endpoint, count in top_endpoints
            ],
        }

    def cleanup_old_logs(self, db: Session, days: int = 30) -> int:
        """
        Delete old usage logs to save space

        Args:
            db: Database session
            days: Delete logs older than this (default 30)

        Returns:
            Number of logs deleted
        """
        cutoff = datetime.utcnow() - timedelta(days=days)

        deleted_count = db.query(APIKeyUsageLog).filter(
            APIKeyUsageLog.timestamp < cutoff
        ).delete(synchronize_session=False)

        db.commit()

        logger.info(f"Cleaned up {deleted_count} old API key usage logs")

        return deleted_count


# Singleton instance
api_key_manager = APIKeyManager()
