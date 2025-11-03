"""
Momentum Index Calculator

The Momentum Index tracks an artist's growth velocity and trajectory.
It helps identify artists who are "heating up" vs "cooling down".

Components:
1. Velocity: Rate of change in followers/listeners
2. Acceleration: Change in growth rate over time
3. Consistency: How steady the growth is
4. Viral Potential: Spike detection in engagement

Score: 0-10 (higher = more momentum)
- 0-3: Declining
- 3-5: Stable
- 5-7: Growing
- 7-9: Rapid growth
- 9-10: Viral/Breakout
"""
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.models.artist import Artist
from app.models.stream_history import StreamHistory
from app.models.social_post import SocialPost
from app.models.platform import PlatformConnection
import logging
import numpy as np

logger = logging.getLogger(__name__)


class MomentumCalculator:
    """Calculate Momentum Index for an artist"""

    def __init__(self, db: Session):
        self.db = db

    def calculate_momentum(self, artist_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Calculate comprehensive Momentum Index

        Args:
            artist_id: Artist UUID
            days: Number of days to analyze

        Returns:
            Dictionary with momentum score and breakdown
        """
        try:
            # Get artist
            artist = self.db.query(Artist).filter(Artist.id == artist_id).first()
            if not artist:
                raise ValueError(f"Artist {artist_id} not found")

            # Get time-series data
            history = self._get_time_series_data(artist_id, days)

            if not history:
                return {
                    "momentum_index": 5.0,
                    "status": "insufficient_data",
                    "message": "Not enough data to calculate momentum",
                }

            # Calculate components
            velocity_score = self._calculate_velocity(history)
            acceleration_score = self._calculate_acceleration(history)
            consistency_score = self._calculate_consistency(history)
            viral_score = self._calculate_viral_potential(artist_id, days)

            # Weighted momentum index
            momentum = (
                velocity_score * 0.35 +
                acceleration_score * 0.30 +
                consistency_score * 0.20 +
                viral_score * 0.15
            )

            # Determine status
            if momentum >= 9:
                status = "viral"
                trend = "breakout"
            elif momentum >= 7:
                status = "rapid_growth"
                trend = "strong_upward"
            elif momentum >= 5:
                status = "growing"
                trend = "upward"
            elif momentum >= 3:
                status = "stable"
                trend = "flat"
            else:
                status = "declining"
                trend = "downward"

            return {
                "momentum_index": round(momentum, 2),
                "status": status,
                "trend": trend,
                "breakdown": {
                    "velocity": round(velocity_score, 2),
                    "acceleration": round(acceleration_score, 2),
                    "consistency": round(consistency_score, 2),
                    "viral_potential": round(viral_score, 2),
                },
                "calculated_at": datetime.utcnow(),
                "period_days": days,
                "data_points": len(history),
            }

        except Exception as e:
            logger.error(f"Error calculating momentum for artist {artist_id}: {e}")
            raise

    def _get_time_series_data(self, artist_id: str, days: int) -> List[Dict[str, Any]]:
        """Get aggregated time-series data across all platforms"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Get all stream history data
        history = (
            self.db.query(StreamHistory)
            .filter(
                StreamHistory.artist_id == artist_id,
                StreamHistory.timestamp >= cutoff_date,
            )
            .order_by(StreamHistory.timestamp.asc())
            .all()
        )

        if not history:
            return []

        # Group by day and aggregate
        daily_data = {}
        for entry in history:
            date_key = entry.timestamp.date()

            if date_key not in daily_data:
                daily_data[date_key] = {
                    "date": date_key,
                    "followers": 0,
                    "listeners": 0,
                    "streams": 0,
                    "count": 0,
                }

            daily_data[date_key]["followers"] += entry.followers or 0
            daily_data[date_key]["listeners"] += entry.monthly_listeners or 0
            daily_data[date_key]["streams"] += entry.total_streams or 0
            daily_data[date_key]["count"] += 1

        # Average the values per day
        result = []
        for date_key in sorted(daily_data.keys()):
            data = daily_data[date_key]
            count = data["count"]
            result.append({
                "date": data["date"],
                "followers": data["followers"] // count if count > 0 else 0,
                "listeners": data["listeners"] // count if count > 0 else 0,
                "streams": data["streams"] // count if count > 0 else 0,
            })

        return result

    def _calculate_velocity(self, history: List[Dict[str, Any]]) -> float:
        """
        Calculate velocity score (0-10) based on rate of growth

        Velocity = average daily change in followers + listeners
        """
        if len(history) < 2:
            return 5.0

        # Calculate daily changes
        daily_changes = []
        for i in range(1, len(history)):
            prev = history[i - 1]
            curr = history[i]

            follower_change = curr["followers"] - prev["followers"]
            listener_change = curr["listeners"] - prev["listeners"]

            # Combined change (weighted)
            total_change = follower_change + (listener_change * 0.5)
            daily_changes.append(total_change)

        if not daily_changes:
            return 5.0

        avg_daily_change = sum(daily_changes) / len(daily_changes)

        # Normalize to 0-10 scale based on average metrics
        # For context: gaining 100 followers/day is good for small artists
        # Large artists might gain 1000+/day

        base_followers = history[0]["followers"]

        if base_followers == 0:
            return 5.0

        # Calculate as percentage of base
        daily_growth_rate = (avg_daily_change / base_followers) * 100

        # Score based on daily growth rate
        if daily_growth_rate >= 1:  # 1% daily growth = viral
            score = 10
        elif daily_growth_rate >= 0.5:  # 0.5% = rapid
            score = 7 + (daily_growth_rate - 0.5) / 0.5 * 3
        elif daily_growth_rate >= 0.1:  # 0.1% = good growth
            score = 5 + (daily_growth_rate - 0.1) / 0.4 * 2
        elif daily_growth_rate >= 0:  # Positive but slow
            score = 3 + (daily_growth_rate / 0.1) * 2
        else:  # Negative growth
            score = max(0, 3 + daily_growth_rate * 10)

        return min(max(score, 0), 10)

    def _calculate_acceleration(self, history: List[Dict[str, Any]]) -> float:
        """
        Calculate acceleration score (0-10) based on change in growth rate

        Acceleration = is the growth rate increasing or decreasing?
        """
        if len(history) < 3:
            return 5.0

        # Split into two halves
        mid = len(history) // 2
        first_half = history[:mid]
        second_half = history[mid:]

        # Calculate growth rate for each half
        def calc_growth_rate(data):
            if len(data) < 2:
                return 0
            first = data[0]
            last = data[-1]

            follower_growth = last["followers"] - first["followers"]
            listener_growth = last["listeners"] - first["listeners"]

            total = follower_growth + (listener_growth * 0.5)
            days = (last["date"] - first["date"]).days or 1

            return total / days

        first_rate = calc_growth_rate(first_half)
        second_rate = calc_growth_rate(second_half)

        if first_rate == 0:
            return 5.0

        # Calculate acceleration as percentage change
        acceleration = ((second_rate - first_rate) / abs(first_rate)) * 100

        # Score based on acceleration
        if acceleration >= 50:  # Growing 50% faster
            score = 10
        elif acceleration >= 20:
            score = 7 + (acceleration - 20) / 30 * 3
        elif acceleration >= 0:
            score = 5 + (acceleration / 20) * 2
        elif acceleration >= -20:
            score = 3 + (acceleration + 20) / 20 * 2
        else:  # Decelerating rapidly
            score = max(0, 3 + acceleration / 10)

        return min(max(score, 0), 10)

    def _calculate_consistency(self, history: List[Dict[str, Any]]) -> float:
        """
        Calculate consistency score (0-10) based on growth stability

        High consistency = steady growth
        Low consistency = erratic growth
        """
        if len(history) < 3:
            return 5.0

        # Calculate daily changes
        changes = []
        for i in range(1, len(history)):
            prev = history[i - 1]
            curr = history[i]

            follower_change = curr["followers"] - prev["followers"]
            listener_change = curr["listeners"] - prev["listeners"]

            total_change = follower_change + (listener_change * 0.5)
            changes.append(total_change)

        if not changes:
            return 5.0

        # Calculate coefficient of variation (lower = more consistent)
        mean = np.mean(changes)
        std = np.std(changes)

        if mean == 0:
            return 5.0

        cv = abs(std / mean)  # Coefficient of variation

        # Score: lower CV = higher consistency
        # CV < 0.2 = very consistent (10)
        # CV 0.2-0.5 = consistent (7-10)
        # CV 0.5-1.0 = moderate (4-7)
        # CV > 1.0 = erratic (0-4)

        if cv <= 0.2:
            score = 10
        elif cv <= 0.5:
            score = 7 + (0.5 - cv) / 0.3 * 3
        elif cv <= 1.0:
            score = 4 + (1.0 - cv) / 0.5 * 3
        else:
            score = max(0, 4 - (cv - 1.0) * 2)

        return min(max(score, 0), 10)

    def _calculate_viral_potential(self, artist_id: str, days: int) -> float:
        """
        Calculate viral potential score (0-10) based on engagement spikes

        Looks for sudden increases in engagement that indicate viral content
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Get recent social posts
        posts = (
            self.db.query(SocialPost)
            .filter(
                SocialPost.artist_id == artist_id,
                SocialPost.posted_at >= cutoff_date,
            )
            .order_by(SocialPost.posted_at.desc())
            .all()
        )

        if not posts:
            return 5.0

        # Calculate average engagement
        engagements = []
        for post in posts:
            total = (post.likes or 0) + (post.comments or 0) + (post.shares or 0)
            engagements.append(total)

        if not engagements:
            return 5.0

        mean_engagement = np.mean(engagements)
        std_engagement = np.std(engagements)

        if std_engagement == 0:
            return 5.0

        # Look for outliers (posts with >2 standard deviations above mean)
        viral_posts = [e for e in engagements if e > mean_engagement + (2 * std_engagement)]

        # Calculate viral score
        viral_ratio = len(viral_posts) / len(posts)
        max_engagement = max(engagements)
        spike_magnitude = (max_engagement - mean_engagement) / mean_engagement if mean_engagement > 0 else 0

        # Score based on viral indicators
        if viral_ratio >= 0.3 and spike_magnitude >= 5:  # Multiple viral posts
            score = 10
        elif viral_ratio >= 0.2 or spike_magnitude >= 3:  # At least one major viral post
            score = 8
        elif viral_ratio >= 0.1 or spike_magnitude >= 1.5:  # Some viral content
            score = 6
        elif spike_magnitude >= 0.5:  # Moderate spikes
            score = 5
        else:  # No significant spikes
            score = 3

        return min(max(score, 0), 10)

    def get_momentum_trend(self, artist_id: str, weeks: int = 12) -> List[Dict[str, Any]]:
        """
        Calculate momentum trend over time

        Args:
            artist_id: Artist UUID
            weeks: Number of weeks to analyze

        Returns:
            List of momentum scores over time
        """
        trend = []

        for i in range(weeks):
            week_days = 30  # Use 30-day rolling window

            try:
                momentum_data = self.calculate_momentum(artist_id, days=week_days)
                trend.append({
                    "week": i + 1,
                    "momentum": momentum_data["momentum_index"],
                    "status": momentum_data["status"],
                    "timestamp": datetime.utcnow() - timedelta(weeks=i),
                })
            except Exception as e:
                logger.warning(f"Could not calculate momentum for week {i}: {e}")
                continue

        return list(reversed(trend))

    def predict_breakout(self, artist_id: str) -> Dict[str, Any]:
        """
        Predict if an artist is on track for a breakout

        Returns probability and key indicators
        """
        try:
            momentum = self.calculate_momentum(artist_id, days=30)

            # Breakout indicators
            is_accelerating = momentum["breakdown"]["acceleration"] >= 7
            has_viral_content = momentum["breakdown"]["viral_potential"] >= 7
            high_velocity = momentum["breakdown"]["velocity"] >= 7
            consistent_growth = momentum["breakdown"]["consistency"] >= 6

            # Count positive indicators
            indicators_met = sum([
                is_accelerating,
                has_viral_content,
                high_velocity,
                consistent_growth,
            ])

            # Calculate probability
            if indicators_met >= 3:
                probability = 0.8 + (indicators_met - 3) * 0.1
                prediction = "high"
            elif indicators_met >= 2:
                probability = 0.5 + (indicators_met - 2) * 0.3
                prediction = "medium"
            else:
                probability = indicators_met * 0.25
                prediction = "low"

            return {
                "prediction": prediction,
                "probability": min(probability, 1.0),
                "indicators": {
                    "accelerating_growth": is_accelerating,
                    "viral_content": has_viral_content,
                    "high_velocity": high_velocity,
                    "consistent_growth": consistent_growth,
                },
                "momentum_index": momentum["momentum_index"],
                "recommendation": self._get_recommendation(momentum, indicators_met),
            }

        except Exception as e:
            logger.error(f"Error predicting breakout for artist {artist_id}: {e}")
            return {
                "prediction": "unknown",
                "probability": 0.0,
                "error": str(e),
            }

    def _get_recommendation(self, momentum: Dict[str, Any], indicators_met: int) -> str:
        """Get actionable recommendation based on momentum"""
        if indicators_met >= 3:
            return "Artist is on fire! Double down on content strategy and consider major releases."
        elif indicators_met >= 2:
            return "Strong momentum detected. Focus on consistency and engagement to maintain growth."
        elif momentum["breakdown"]["viral_potential"] >= 6:
            return "Viral content detected. Capitalize on momentum with quick follow-up content."
        elif momentum["breakdown"]["consistency"] < 5:
            return "Growth is erratic. Focus on establishing a consistent posting schedule."
        else:
            return "Build foundation with regular content and audience engagement."
