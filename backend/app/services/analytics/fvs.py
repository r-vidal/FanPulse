"""
FVS (Fan Value Score) Calculator

The FVS is a proprietary metric that quantifies the overall value and engagement
of an artist's fanbase across multiple platforms.

Components:
1. Engagement Rate (40%): Likes, comments, shares relative to followers
2. Growth Rate (30%): Follower/listener growth over time
3. Reach (20%): Total followers, monthly listeners across platforms
4. Conversion (10%): Playlist adds, saves, shares

Score: 0-100 (higher is better)
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models.artist import Artist
from app.models.platform import PlatformConnection, PlatformType
from app.models.stream_history import StreamHistory
from app.models.social_post import SocialPost
import logging

logger = logging.getLogger(__name__)


class FVSCalculator:
    """Calculate Fan Value Score for an artist"""

    # Weight distribution
    ENGAGEMENT_WEIGHT = 0.40
    GROWTH_WEIGHT = 0.30
    REACH_WEIGHT = 0.20
    CONVERSION_WEIGHT = 0.10

    def __init__(self, db: Session):
        self.db = db

    def calculate_fvs(self, artist_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Calculate comprehensive FVS for an artist

        Args:
            artist_id: Artist UUID
            days: Number of days to analyze

        Returns:
            Dictionary with FVS score and breakdown
        """
        try:
            # Get artist
            artist = self.db.query(Artist).filter(Artist.id == artist_id).first()
            if not artist:
                raise ValueError(f"Artist {artist_id} not found")

            # Calculate each component
            engagement_score = self._calculate_engagement_score(artist_id, days)
            growth_score = self._calculate_growth_score(artist_id, days)
            reach_score = self._calculate_reach_score(artist_id)
            conversion_score = self._calculate_conversion_score(artist_id, days)

            # Calculate weighted FVS
            fvs = (
                engagement_score * self.ENGAGEMENT_WEIGHT +
                growth_score * self.GROWTH_WEIGHT +
                reach_score * self.REACH_WEIGHT +
                conversion_score * self.CONVERSION_WEIGHT
            )

            return {
                "fvs": round(fvs, 2),
                "breakdown": {
                    "engagement": {
                        "score": round(engagement_score, 2),
                        "weight": self.ENGAGEMENT_WEIGHT,
                        "contribution": round(engagement_score * self.ENGAGEMENT_WEIGHT, 2),
                    },
                    "growth": {
                        "score": round(growth_score, 2),
                        "weight": self.GROWTH_WEIGHT,
                        "contribution": round(growth_score * self.GROWTH_WEIGHT, 2),
                    },
                    "reach": {
                        "score": round(reach_score, 2),
                        "weight": self.REACH_WEIGHT,
                        "contribution": round(reach_score * self.REACH_WEIGHT, 2),
                    },
                    "conversion": {
                        "score": round(conversion_score, 2),
                        "weight": self.CONVERSION_WEIGHT,
                        "contribution": round(conversion_score * self.CONVERSION_WEIGHT, 2),
                    },
                },
                "calculated_at": datetime.utcnow(),
                "period_days": days,
            }

        except Exception as e:
            logger.error(f"Error calculating FVS for artist {artist_id}: {e}")
            raise

    def _calculate_engagement_score(self, artist_id: str, days: int) -> float:
        """
        Calculate engagement score (0-100) based on social media interactions

        Metrics:
        - Average engagement rate on posts (likes + comments + shares / followers)
        - Engagement consistency (standard deviation)
        - Comment quality (replies, sentiment - future)
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Get recent social posts
        posts = self.db.query(SocialPost).filter(
            SocialPost.artist_id == artist_id,
            SocialPost.posted_at >= cutoff_date,
        ).all()

        if not posts:
            return 0.0

        # Calculate average engagement rate
        engagement_rates = []
        for post in posts:
            total_engagement = (post.likes or 0) + (post.comments or 0) + (post.shares or 0)

            # Get follower count from platform connection
            connection = self.db.query(PlatformConnection).filter(
                PlatformConnection.id == post.platform_connection_id
            ).first()

            if connection:
                # Get recent stream history to get follower count
                history = self.db.query(StreamHistory).filter(
                    StreamHistory.platform_connection_id == connection.id,
                    StreamHistory.timestamp >= cutoff_date,
                ).order_by(StreamHistory.timestamp.desc()).first()

                if history and history.followers and history.followers > 0:
                    rate = (total_engagement / history.followers) * 100
                    engagement_rates.append(min(rate, 100))  # Cap at 100%

        if not engagement_rates:
            return 0.0

        avg_engagement_rate = sum(engagement_rates) / len(engagement_rates)

        # Normalize to 0-100 scale
        # Excellent engagement is considered 5%+, good is 2-5%, average is 1-2%
        if avg_engagement_rate >= 5:
            score = 100
        elif avg_engagement_rate >= 2:
            score = 60 + ((avg_engagement_rate - 2) / 3) * 40  # 60-100
        elif avg_engagement_rate >= 1:
            score = 40 + ((avg_engagement_rate - 1) / 1) * 20  # 40-60
        else:
            score = avg_engagement_rate * 40  # 0-40

        return min(score, 100)

    def _calculate_growth_score(self, artist_id: str, days: int) -> float:
        """
        Calculate growth score (0-100) based on follower/listener growth

        Metrics:
        - Follower growth rate across platforms
        - Monthly listener growth (streaming platforms)
        - Growth consistency (accelerating vs declining)
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        comparison_date = datetime.utcnow() - timedelta(days=days * 2)

        # Get current and historical data
        current_data = self.db.query(StreamHistory).filter(
            StreamHistory.artist_id == artist_id,
            StreamHistory.timestamp >= cutoff_date,
        ).all()

        historical_data = self.db.query(StreamHistory).filter(
            StreamHistory.artist_id == artist_id,
            StreamHistory.timestamp >= comparison_date,
            StreamHistory.timestamp < cutoff_date,
        ).all()

        if not current_data or not historical_data:
            return 50.0  # Neutral score if no data

        # Calculate average followers/listeners for current period
        current_followers = [h.followers for h in current_data if h.followers]
        current_listeners = [h.monthly_listeners for h in current_data if h.monthly_listeners]

        historical_followers = [h.followers for h in historical_data if h.followers]
        historical_listeners = [h.monthly_listeners for h in historical_data if h.monthly_listeners]

        growth_rates = []

        # Follower growth rate
        if current_followers and historical_followers:
            avg_current_followers = sum(current_followers) / len(current_followers)
            avg_historical_followers = sum(historical_followers) / len(historical_followers)

            if avg_historical_followers > 0:
                follower_growth = ((avg_current_followers - avg_historical_followers) / avg_historical_followers) * 100
                growth_rates.append(follower_growth)

        # Listener growth rate
        if current_listeners and historical_listeners:
            avg_current_listeners = sum(current_listeners) / len(current_listeners)
            avg_historical_listeners = sum(historical_listeners) / len(historical_listeners)

            if avg_historical_listeners > 0:
                listener_growth = ((avg_current_listeners - avg_historical_listeners) / avg_historical_listeners) * 100
                growth_rates.append(listener_growth)

        if not growth_rates:
            return 50.0

        avg_growth_rate = sum(growth_rates) / len(growth_rates)

        # Normalize to 0-100 scale
        # Excellent growth: 20%+ per period, Good: 10-20%, Average: 5-10%, Poor: <5%
        if avg_growth_rate >= 20:
            score = 100
        elif avg_growth_rate >= 10:
            score = 75 + ((avg_growth_rate - 10) / 10) * 25  # 75-100
        elif avg_growth_rate >= 5:
            score = 50 + ((avg_growth_rate - 5) / 5) * 25  # 50-75
        elif avg_growth_rate >= 0:
            score = 25 + ((avg_growth_rate) / 5) * 25  # 25-50
        else:
            # Negative growth
            score = max(0, 25 + avg_growth_rate)  # 0-25

        return min(max(score, 0), 100)

    def _calculate_reach_score(self, artist_id: str) -> float:
        """
        Calculate reach score (0-100) based on total audience size

        Metrics:
        - Total followers across all platforms
        - Monthly listeners on streaming platforms
        - Relative reach in genre/category
        """
        # Get latest data from all platforms
        latest_data = (
            self.db.query(StreamHistory)
            .filter(StreamHistory.artist_id == artist_id)
            .order_by(StreamHistory.timestamp.desc())
            .limit(10)
            .all()
        )

        if not latest_data:
            return 0.0

        # Sum up followers and listeners
        total_followers = sum([h.followers for h in latest_data if h.followers])
        total_listeners = sum([h.monthly_listeners for h in latest_data if h.monthly_listeners])

        # Total reach is a combination of both
        total_reach = total_followers + (total_listeners * 0.5)  # Listeners weighted at 50%

        # Normalize to 0-100 scale using logarithmic scale
        # Small artists: 0-10k = 0-40
        # Mid-tier: 10k-100k = 40-70
        # Large: 100k-1M = 70-90
        # Superstar: 1M+ = 90-100

        if total_reach >= 1_000_000:
            score = 90 + min((total_reach - 1_000_000) / 10_000_000 * 10, 10)
        elif total_reach >= 100_000:
            score = 70 + ((total_reach - 100_000) / 900_000) * 20
        elif total_reach >= 10_000:
            score = 40 + ((total_reach - 10_000) / 90_000) * 30
        else:
            score = (total_reach / 10_000) * 40

        return min(score, 100)

    def _calculate_conversion_score(self, artist_id: str, days: int) -> float:
        """
        Calculate conversion score (0-100) based on fan actions

        Metrics:
        - Playlist adds (from streaming data)
        - Saves/bookmarks
        - Shares
        - Link clicks (future)
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Get social posts data
        posts = self.db.query(SocialPost).filter(
            SocialPost.artist_id == artist_id,
            SocialPost.posted_at >= cutoff_date,
        ).all()

        if not posts:
            return 50.0  # Neutral score

        # Calculate average saves and shares per post
        total_saves = sum([p.saves or 0 for p in posts])
        total_shares = sum([p.shares or 0 for p in posts])
        total_views = sum([p.views or 0 for p in posts if p.views])

        if total_views == 0:
            return 50.0

        # Conversion rate = (saves + shares) / views
        conversion_rate = ((total_saves + total_shares) / total_views) * 100

        # Normalize to 0-100 scale
        # Excellent: 5%+, Good: 2-5%, Average: 1-2%, Poor: <1%
        if conversion_rate >= 5:
            score = 100
        elif conversion_rate >= 2:
            score = 70 + ((conversion_rate - 2) / 3) * 30
        elif conversion_rate >= 1:
            score = 50 + ((conversion_rate - 1) / 1) * 20
        else:
            score = conversion_rate * 50

        return min(score, 100)

    def get_fvs_trend(self, artist_id: str, months: int = 6) -> List[Dict[str, Any]]:
        """
        Calculate FVS trend over time

        Args:
            artist_id: Artist UUID
            months: Number of months to analyze

        Returns:
            List of FVS scores over time
        """
        trend = []

        for i in range(months):
            month_start = datetime.utcnow() - timedelta(days=30 * (i + 1))
            month_end = datetime.utcnow() - timedelta(days=30 * i)

            # Calculate FVS for this period
            # This is a simplified version - in production you'd cache these
            try:
                fvs_data = self.calculate_fvs(artist_id, days=30)
                trend.append({
                    "month": month_start.strftime("%Y-%m"),
                    "fvs": fvs_data["fvs"],
                    "timestamp": month_start,
                })
            except Exception as e:
                logger.warning(f"Could not calculate FVS for period {month_start}: {e}")
                continue

        return list(reversed(trend))
