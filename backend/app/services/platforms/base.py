"""Base platform service with common functionality"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class RateLimitException(Exception):
    """Raised when API rate limit is exceeded"""
    pass


class PlatformServiceBase(ABC):
    """Base class for all platform integrations"""

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.base_url = self.get_base_url()

    @abstractmethod
    def get_base_url(self) -> str:
        """Return the base URL for the platform API"""
        pass

    @abstractmethod
    async def get_authorization_url(self, state: str) -> str:
        """Generate OAuth authorization URL"""
        pass

    @abstractmethod
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        pass

    @abstractmethod
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh expired access token"""
        pass

    @abstractmethod
    async def get_artist_data(self, platform_artist_id: str, access_token: str) -> Dict[str, Any]:
        """Fetch artist profile data from the platform"""
        pass

    @abstractmethod
    async def get_streaming_stats(
        self,
        platform_artist_id: str,
        access_token: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """Fetch streaming statistics for the artist"""
        pass

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.ConnectError, httpx.TimeoutException)),
    )
    async def make_request(
        self,
        method: str,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Make HTTP request with retry logic and error handling
        """
        try:
            response = await self.client.request(
                method=method,
                url=url,
                headers=headers,
                params=params,
                json=json,
            )

            # Check for rate limiting
            if response.status_code == 429:
                retry_after = int(response.headers.get("Retry-After", 60))
                logger.warning(f"Rate limited. Retry after {retry_after} seconds")
                raise RateLimitException(f"Rate limited. Retry after {retry_after} seconds")

            # Raise for other HTTP errors
            response.raise_for_status()

            return response.json()

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error occurred: {e}")
            raise
        except Exception as e:
            logger.error(f"Request failed: {e}")
            raise

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()

    def is_token_expired(self, expires_at: datetime) -> bool:
        """Check if access token is expired"""
        return datetime.utcnow() >= expires_at

    def get_token_expiry(self, expires_in: int) -> datetime:
        """Calculate token expiry datetime"""
        return datetime.utcnow() + timedelta(seconds=expires_in)
