"""
Token Manager Service

Handles automatic refresh of expired OAuth tokens for all platforms.
This service prevents token expiration errors by proactively refreshing tokens.
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import Optional
import logging

from app.models.platform import PlatformConnection, PlatformType
from app.services.platforms.spotify import SpotifyService
from app.services.platforms.instagram import InstagramService
from app.services.platforms.apple_music import AppleMusicService

logger = logging.getLogger(__name__)


class TokenManager:
    """
    Manages OAuth token lifecycle for all platform connections

    Features:
    - Automatic token refresh before expiration
    - Platform-specific refresh logic
    - Error handling and logging
    - Token validation
    """

    # Refresh tokens if they expire within this window
    REFRESH_WINDOW = timedelta(minutes=30)

    async def ensure_valid_token(
        self,
        platform_connection: PlatformConnection,
        db: Session
    ) -> str:
        """
        Ensures the platform connection has a valid access token.
        Refreshes the token if it's expired or about to expire.

        Args:
            platform_connection: The platform connection to validate
            db: Database session

        Returns:
            Valid access token

        Raises:
            Exception: If token refresh fails
        """
        # Check if token needs refresh
        if not self._needs_refresh(platform_connection):
            return platform_connection.access_token

        # Refresh token based on platform type
        try:
            new_token_data = await self._refresh_token(platform_connection)

            # Update platform connection with new token
            platform_connection.access_token = new_token_data["access_token"]

            # Some platforms return new refresh tokens
            if "refresh_token" in new_token_data:
                platform_connection.refresh_token = new_token_data["refresh_token"]

            # Calculate new expiration time
            expires_in = new_token_data.get("expires_in", 3600)
            platform_connection.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

            # Clear any previous sync errors
            platform_connection.sync_error = None
            platform_connection.updated_at = datetime.utcnow()

            db.commit()

            logger.info(
                f"Successfully refreshed token for {platform_connection.platform_type} "
                f"(connection {platform_connection.id})"
            )

            return platform_connection.access_token

        except Exception as e:
            logger.error(
                f"Failed to refresh token for {platform_connection.platform_type}: {str(e)}"
            )
            # Store error in database
            platform_connection.sync_error = f"Token refresh failed: {str(e)}"
            platform_connection.is_active = False
            db.commit()
            raise

    def _needs_refresh(self, platform_connection: PlatformConnection) -> bool:
        """
        Check if token needs to be refreshed

        Returns True if:
        - Token is already expired
        - Token will expire within REFRESH_WINDOW
        - No expiration time is set (invalid state)
        """
        if not platform_connection.token_expires_at:
            return True

        refresh_threshold = datetime.utcnow() + self.REFRESH_WINDOW
        return platform_connection.token_expires_at <= refresh_threshold

    async def _refresh_token(self, platform_connection: PlatformConnection) -> dict:
        """
        Refresh token using platform-specific service

        Args:
            platform_connection: Connection to refresh

        Returns:
            Token data dict with access_token, refresh_token (optional), expires_in
        """
        if not platform_connection.refresh_token:
            raise ValueError(
                f"No refresh token available for {platform_connection.platform_type}"
            )

        platform_type = platform_connection.platform_type

        if platform_type == PlatformType.SPOTIFY:
            service = SpotifyService()
            try:
                return await service.refresh_access_token(platform_connection.refresh_token)
            finally:
                await service.close()

        elif platform_type == PlatformType.INSTAGRAM:
            service = InstagramService()
            try:
                return await service.refresh_access_token(platform_connection.refresh_token)
            finally:
                await service.close()

        elif platform_type == PlatformType.APPLE_MUSIC:
            # Apple Music uses JWT tokens that we generate, not OAuth
            # No refresh needed - we generate new tokens as needed
            service = AppleMusicService()
            return {
                "access_token": await service.generate_developer_token(),
                "expires_in": 15777000  # 6 months (Apple's max)
            }

        elif platform_type == PlatformType.TIKTOK:
            from app.services.platforms.tiktok import TikTokService
            service = TikTokService()
            try:
                return await service.refresh_access_token(platform_connection.refresh_token)
            finally:
                await service.close()

        elif platform_type == PlatformType.YOUTUBE:
            from app.services.platforms.youtube import YouTubeService
            service = YouTubeService()
            try:
                return await service.refresh_access_token(platform_connection.refresh_token)
            finally:
                await service.close()

        else:
            raise NotImplementedError(
                f"Token refresh not implemented for {platform_type}"
            )

    async def refresh_all_expiring_tokens(self, db: Session) -> dict:
        """
        Background task: Refresh all tokens that are about to expire

        Should be run periodically (e.g., every hour via Celery)

        Args:
            db: Database session

        Returns:
            dict with success/failure counts
        """
        # Find all connections with tokens expiring soon
        refresh_threshold = datetime.utcnow() + self.REFRESH_WINDOW

        expiring_connections = db.query(PlatformConnection).filter(
            PlatformConnection.is_active == True,
            PlatformConnection.refresh_token.isnot(None),
            PlatformConnection.token_expires_at <= refresh_threshold
        ).all()

        results = {
            "total": len(expiring_connections),
            "success": 0,
            "failed": 0,
            "errors": []
        }

        for connection in expiring_connections:
            try:
                await self.ensure_valid_token(connection, db)
                results["success"] += 1
            except Exception as e:
                results["failed"] += 1
                results["errors"].append({
                    "connection_id": str(connection.id),
                    "platform": connection.platform_type.value,
                    "error": str(e)
                })

        logger.info(
            f"Token refresh batch complete: {results['success']} succeeded, "
            f"{results['failed']} failed out of {results['total']} total"
        )

        return results


# Global instance
token_manager = TokenManager()
