"""
Momentum Index Calculator

Calculates a 0-10 momentum score for an artist based on:
- Popularity trend
- Follower growth
- Top tracks performance
- Engagement metrics

Classification:
- Fire: > 7
- Growing: 5-7
- Stable: 3-5
- Declining: < 3
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.stream_history import StreamHistory
import logging

logger = logging.getLogger(__name__)


class MomentumCalculator:
    """Calculate momentum score for an artist"""

    def __init__(self, db: Session):
        self.db = db

    def calculate_momentum(
        self,
        artist_id: str,
        current_stats: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate momentum score 0-10

        Args:
            artist_id: UUID of artist
            current_stats: Current stats from Spotify (followers, popularity, etc.)

        Returns:
            {
                "score": float (0-10),
                "status": str ("fire", "growing", "stable", "declining"),
                "signals": dict with breakdown,
                "trend_7d": float,
                "trend_30d": float
            }
        """
        # Get historical data
        history_7d = self._get_history(artist_id, days=7)
        history_30d = self._get_history(artist_id, days=30)

        # Calculate component scores (0-10 each)
        popularity_score = self._calculate_popularity_score(
            current_stats.get('popularity', 0)
        )

        follower_growth_score = self._calculate_follower_growth_score(
            current_stats.get('followers', 0),
            history_7d,
            history_30d
        )

        top_tracks_score = self._calculate_top_tracks_score(
            current_stats.get('top_tracks', [])
        )

        # Weighted average
        # Popularity: 40%, Follower Growth: 30%, Top Tracks: 30%
        momentum_score = (
            popularity_score * 0.4 +
            follower_growth_score * 0.3 +
            top_tracks_score * 0.3
        )

        # Classify status
        status = self._classify_status(momentum_score)

        # Calculate trends
        trend_7d = self._calculate_trend(history_7d)
        trend_30d = self._calculate_trend(history_30d)

        return {
            "score": round(momentum_score, 2),
            "status": status,
            "signals": {
                "popularity": round(popularity_score, 2),
                "follower_growth": round(follower_growth_score, 2),
                "top_tracks": round(top_tracks_score, 2)
            },
            "trend_7d": round(trend_7d, 2) if trend_7d is not None else None,
            "trend_30d": round(trend_30d, 2) if trend_30d is not None else None,
            "data_points": {
                "7d": len(history_7d),
                "30d": len(history_30d)
            }
        }

    def _get_history(
        self,
        artist_id: str,
        days: int
    ) -> List[StreamHistory]:
        """Get historical data for the last N days"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        return self.db.query(StreamHistory).filter(
            StreamHistory.artist_id == artist_id,
            StreamHistory.timestamp >= cutoff_date
        ).order_by(
            StreamHistory.timestamp.asc()
        ).all()

    def _calculate_popularity_score(self, popularity: int) -> float:
        """
        Convert Spotify popularity (0-100) to momentum score (0-10)

        Spotify popularity is already a good indicator of momentum
        """
        return (popularity / 100) * 10

    def _calculate_follower_growth_score(
        self,
        current_followers: int,
        history_7d: List[StreamHistory],
        history_30d: List[StreamHistory]
    ) -> float:
        """
        Calculate score based on follower growth rate

        Returns 0-10 based on growth percentage
        """
        if not history_7d or not history_30d:
            # No historical data, use current follower count as proxy
            # Scale: 0-100k followers = 0-10 score
            return min(10, (current_followers / 100000) * 10)

        # Calculate 7-day growth
        if len(history_7d) >= 2:
            oldest_7d = history_7d[0].followers
            growth_7d = ((current_followers - oldest_7d) / max(oldest_7d, 1)) * 100

            # Convert growth % to score
            # 0% = 3, 1% = 5, 5% = 8, 10%+ = 10
            if growth_7d >= 10:
                score = 10
            elif growth_7d >= 5:
                score = 8
            elif growth_7d >= 1:
                score = 5 + (growth_7d - 1) * 0.75
            elif growth_7d >= 0:
                score = 3 + growth_7d * 2
            else:  # Negative growth
                score = max(0, 3 + growth_7d * 0.5)

            return score

        # Fallback
        return 5.0

    def _calculate_top_tracks_score(
        self,
        top_tracks: List[Dict[str, Any]]
    ) -> float:
        """
        Calculate score based on top tracks performance

        Average popularity of top 5 tracks
        """
        if not top_tracks:
            return 5.0

        # Get top 5 tracks
        top_5 = top_tracks[:5]

        # Average popularity
        avg_popularity = sum(
            track.get('popularity', 0) for track in top_5
        ) / len(top_5)

        # Convert to 0-10 scale
        return (avg_popularity / 100) * 10

    def _calculate_trend(
        self,
        history: List[StreamHistory]
    ) -> Optional[float]:
        """
        Calculate trend from historical data

        Returns: % change from oldest to newest data point
        """
        if len(history) < 2:
            return None

        oldest = history[0]
        newest = history[-1]

        # Calculate trend based on followers
        if oldest.followers > 0:
            return ((newest.followers - oldest.followers) / oldest.followers) * 100

        return None

    def _classify_status(self, score: float) -> str:
        """
        Classify momentum status based on score

        - Fire: > 7
        - Growing: 5-7
        - Stable: 3-5
        - Declining: < 3
        """
        if score > 7:
            return "fire"
        elif score >= 5:
            return "growing"
        elif score >= 3:
            return "stable"
        else:
            return "declining"
