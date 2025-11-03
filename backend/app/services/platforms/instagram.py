"""Instagram API integration service"""
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from urllib.parse import urlencode
from app.services.platforms.base import PlatformServiceBase
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class InstagramService(PlatformServiceBase):
    """
    Instagram API integration

    Uses two different APIs:
    1. Instagram Basic Display API - For basic profile and media (personal accounts)
    2. Instagram Graph API - For business/creator accounts with insights

    For artist analytics, Graph API is preferred as it provides:
    - Follower demographics
    - Post reach and engagement
    - Story insights
    - Audience insights

    Docs:
    - Basic Display: https://developers.facebook.com/docs/instagram-basic-display-api
    - Graph API: https://developers.facebook.com/docs/instagram-api
    """

    def __init__(self):
        super().__init__()
        self.client_id = settings.INSTAGRAM_CLIENT_ID
        self.client_secret = settings.INSTAGRAM_CLIENT_SECRET
        self.redirect_uri = settings.INSTAGRAM_REDIRECT_URI
        self.graph_api_url = "https://graph.instagram.com"
        self.facebook_graph_url = "https://graph.facebook.com/v18.0"

    def get_base_url(self) -> str:
        return "https://graph.instagram.com"

    async def get_authorization_url(self, state: str) -> str:
        """
        Generate Instagram OAuth authorization URL

        For Basic Display API (personal accounts)
        """
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "user_profile,user_media",
            "response_type": "code",
            "state": state,
        }
        return f"https://api.instagram.com/oauth/authorize?{urlencode(params)}"

    async def get_business_authorization_url(self, state: str) -> str:
        """
        Generate Facebook Login authorization URL for Instagram Business accounts

        This is required for accessing Instagram Graph API with insights
        """
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "state": state,
            "scope": "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,instagram_manage_insights",
        }
        return f"https://www.facebook.com/v18.0/dialog/oauth?{urlencode(params)}"

    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access token (Basic Display API)
        """
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "authorization_code",
            "redirect_uri": self.redirect_uri,
            "code": code,
        }

        response = await self.make_request(
            method="POST",
            url="https://api.instagram.com/oauth/access_token",
            json=data,
        )

        # Exchange short-lived token for long-lived token
        long_lived = await self._get_long_lived_token(response["access_token"])

        return {
            "access_token": long_lived["access_token"],
            "refresh_token": None,
            "expires_in": long_lived.get("expires_in", 5184000),  # 60 days
            "token_type": "Bearer",
            "user_id": response.get("user_id"),
        }

    async def _get_long_lived_token(self, short_lived_token: str) -> Dict[str, Any]:
        """Convert short-lived token to long-lived token (60 days)"""
        params = {
            "grant_type": "ig_exchange_token",
            "client_secret": self.client_secret,
            "access_token": short_lived_token,
        }

        response = await self.make_request(
            method="GET",
            url=f"{self.graph_api_url}/access_token",
            params=params,
        )

        return response

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh long-lived access token

        Instagram long-lived tokens can be refreshed if they haven't expired (60 days)
        """
        params = {
            "grant_type": "ig_refresh_token",
            "access_token": refresh_token,
        }

        response = await self.make_request(
            method="GET",
            url=f"{self.graph_api_url}/refresh_access_token",
            params=params,
        )

        return {
            "access_token": response["access_token"],
            "expires_in": response.get("expires_in", 5184000),
            "token_type": "Bearer",
        }

    async def get_artist_data(self, platform_artist_id: str, access_token: str) -> Dict[str, Any]:
        """
        Fetch Instagram profile data

        For Basic Display API, returns basic profile info
        For Graph API (business accounts), returns more detailed info
        """
        params = {
            "fields": "id,username,account_type,media_count",
            "access_token": access_token,
        }

        try:
            # Try Business/Creator account first (Graph API)
            response = await self.make_request(
                method="GET",
                url=f"{self.facebook_graph_url}/{platform_artist_id}",
                params={
                    **params,
                    "fields": "id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website",
                },
            )

            return {
                "id": response.get("id"),
                "username": response.get("username"),
                "name": response.get("name"),
                "biography": response.get("biography"),
                "followers": response.get("followers_count", 0),
                "following": response.get("follows_count", 0),
                "media_count": response.get("media_count", 0),
                "profile_picture": response.get("profile_picture_url"),
                "website": response.get("website"),
                "account_type": "business",
                "raw_data": response,
            }

        except Exception as e:
            logger.warning(f"Business API failed, trying Basic Display API: {e}")

            # Fallback to Basic Display API
            response = await self.make_request(
                method="GET",
                url=f"{self.graph_api_url}/{platform_artist_id}",
                params=params,
            )

            return {
                "id": response.get("id"),
                "username": response.get("username"),
                "account_type": response.get("account_type", "personal"),
                "media_count": response.get("media_count", 0),
                "followers": None,  # Not available in Basic Display API
                "following": None,
                "raw_data": response,
            }

    async def get_streaming_stats(
        self,
        platform_artist_id: str,
        access_token: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Fetch Instagram insights (requires Business/Creator account)

        Returns engagement metrics, reach, impressions, etc.
        """
        profile = await self.get_artist_data(platform_artist_id, access_token)

        if profile.get("account_type") != "business":
            logger.warning("Insights only available for Business/Creator accounts")
            return {
                "timestamp": datetime.utcnow(),
                "followers": profile.get("followers", 0),
                "note": "Detailed insights require Instagram Business/Creator account",
                "raw_data": profile,
            }

        # Get account insights
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()

        params = {
            "metric": "impressions,reach,follower_count,profile_views",
            "period": "day",
            "since": int(start_date.timestamp()),
            "until": int(end_date.timestamp()),
            "access_token": access_token,
        }

        try:
            response = await self.make_request(
                method="GET",
                url=f"{self.facebook_graph_url}/{platform_artist_id}/insights",
                params=params,
            )

            insights = {}
            for metric in response.get("data", []):
                metric_name = metric.get("name")
                values = metric.get("values", [])
                if values:
                    # Get the most recent value
                    insights[metric_name] = values[-1].get("value", 0)

            return {
                "timestamp": datetime.utcnow(),
                "followers": profile.get("followers", 0),
                "impressions": insights.get("impressions", 0),
                "reach": insights.get("reach", 0),
                "profile_views": insights.get("profile_views", 0),
                "raw_data": {
                    "profile": profile,
                    "insights": insights,
                },
            }

        except Exception as e:
            logger.error(f"Failed to fetch insights: {e}")
            return {
                "timestamp": datetime.utcnow(),
                "followers": profile.get("followers", 0),
                "error": str(e),
                "raw_data": profile,
            }

    async def get_recent_media(
        self, platform_artist_id: str, access_token: str, limit: int = 25
    ) -> List[Dict[str, Any]]:
        """
        Get recent posts from Instagram profile

        Works for both Basic Display and Graph API
        """
        params = {
            "fields": "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
            "limit": limit,
            "access_token": access_token,
        }

        try:
            # Try Graph API first (business accounts)
            response = await self.make_request(
                method="GET",
                url=f"{self.facebook_graph_url}/{platform_artist_id}/media",
                params=params,
            )
        except:
            # Fallback to Basic Display API
            params["fields"] = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp"
            response = await self.make_request(
                method="GET",
                url=f"{self.graph_api_url}/{platform_artist_id}/media",
                params=params,
            )

        media_items = response.get("data", [])

        return [
            {
                "id": item.get("id"),
                "caption": item.get("caption", ""),
                "media_type": item.get("media_type"),
                "media_url": item.get("media_url"),
                "thumbnail_url": item.get("thumbnail_url"),
                "permalink": item.get("permalink"),
                "timestamp": item.get("timestamp"),
                "likes": item.get("like_count", 0),
                "comments": item.get("comments_count", 0),
            }
            for item in media_items
        ]

    async def get_media_insights(
        self, media_id: str, access_token: str
    ) -> Dict[str, Any]:
        """
        Get insights for a specific post (Business accounts only)

        Returns engagement, reach, impressions, saves, etc.
        """
        params = {
            "metric": "engagement,impressions,reach,saved",
            "access_token": access_token,
        }

        response = await self.make_request(
            method="GET",
            url=f"{self.facebook_graph_url}/{media_id}/insights",
            params=params,
        )

        insights = {}
        for metric in response.get("data", []):
            metric_name = metric.get("name")
            values = metric.get("values", [])
            if values:
                insights[metric_name] = values[0].get("value", 0)

        return insights

    async def get_audience_insights(
        self, platform_artist_id: str, access_token: str
    ) -> Dict[str, Any]:
        """
        Get audience demographics and insights (Business accounts only)

        Returns follower demographics by age, gender, location, etc.
        """
        params = {
            "metric": "audience_city,audience_country,audience_gender_age",
            "period": "lifetime",
            "access_token": access_token,
        }

        response = await self.make_request(
            method="GET",
            url=f"{self.facebook_graph_url}/{platform_artist_id}/insights",
            params=params,
        )

        demographics = {}
        for metric in response.get("data", []):
            metric_name = metric.get("name")
            values = metric.get("values", [])
            if values:
                demographics[metric_name] = values[0].get("value", {})

        return demographics

    async def search_location(self, query: str, access_token: str) -> List[Dict[str, Any]]:
        """Search for Instagram locations (useful for geo-tagging analysis)"""
        params = {
            "type": "place",
            "q": query,
            "access_token": access_token,
        }

        response = await self.make_request(
            method="GET",
            url=f"{self.facebook_graph_url}/search",
            params=params,
        )

        return response.get("data", [])
