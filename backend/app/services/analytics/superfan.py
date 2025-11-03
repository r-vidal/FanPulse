"""
Superfan Analyzer

Identifies and tracks high-value fans based on engagement patterns.

Superfan Criteria:
1. Engagement Frequency: Likes/comments on most posts
2. Interaction Quality: Meaningful comments, shares
3. Consistency: Regular engagement over time
4. Advocacy: Shares, tags friends, defends artist
5. Conversion: Clicks links, saves content, adds to playlists

Superfan Tiers:
- Platinum: Top 1% of fans (advocates, evangelists)
- Gold: Top 5% (highly engaged)
- Silver: Top 15% (regular engagers)
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from app.models.artist import Artist
from app.models.superfan import Superfan
from app.models.social_post import SocialPost
from app.models.stream_history import StreamHistory
import logging

logger = logging.getLogger(__name__)


class SuperfanAnalyzer:
    """Identify and analyze superfans"""

    def __init__(self, db: Session):
        self.db = db

    def identify_superfans(
        self,
        artist_id: str,
        min_engagement_score: float = 7.0,
        days: int = 90,
    ) -> List[Dict[str, Any]]:
        """
        Identify superfans for an artist

        Args:
            artist_id: Artist UUID
            min_engagement_score: Minimum score to be considered a superfan
            days: Number of days to analyze

        Returns:
            List of superfan profiles
        """
        try:
            # Get existing superfans
            superfans = (
                self.db.query(Superfan)
                .filter(Superfan.artist_id == artist_id)
                .all()
            )

            # Calculate engagement scores for each
            superfan_profiles = []
            for superfan in superfans:
                score = self._calculate_engagement_score(artist_id, superfan.email, days)

                if score >= min_engagement_score:
                    tier = self._determine_tier(score)

                    superfan_profiles.append({
                        "id": str(superfan.id),
                        "email": superfan.email,
                        "name": superfan.name,
                        "engagement_score": round(score, 2),
                        "tier": tier,
                        "lifetime_value": superfan.lifetime_value,
                        "last_interaction": superfan.last_interaction,
                        "location": superfan.location,
                    })

            # Sort by engagement score
            superfan_profiles.sort(key=lambda x: x["engagement_score"], reverse=True)

            return superfan_profiles

        except Exception as e:
            logger.error(f"Error identifying superfans for artist {artist_id}: {e}")
            raise

    def _calculate_engagement_score(
        self,
        artist_id: str,
        fan_email: str,
        days: int,
    ) -> float:
        """
        Calculate engagement score for a specific fan

        This is a simplified version - in production you'd track individual
        fan interactions through analytics SDKs, email tracking, etc.

        Score components:
        - Frequency: How often they engage (40%)
        - Recency: When was last interaction (20%)
        - Quality: Type of engagement (30%)
        - Advocacy: Shares and referrals (10%)
        """
        # For now, this is a placeholder that uses the superfan model data
        superfan = (
            self.db.query(Superfan)
            .filter(
                Superfan.artist_id == artist_id,
                Superfan.email == fan_email,
            )
            .first()
        )

        if not superfan:
            return 0.0

        score = superfan.engagement_score or 0.0
        return min(score, 10.0)

    def _determine_tier(self, engagement_score: float) -> str:
        """Determine superfan tier based on score"""
        if engagement_score >= 9.0:
            return "platinum"
        elif engagement_score >= 7.5:
            return "gold"
        elif engagement_score >= 6.0:
            return "silver"
        else:
            return "bronze"

    def get_superfan_insights(self, artist_id: str) -> Dict[str, Any]:
        """
        Get comprehensive superfan insights for an artist

        Returns:
            Dictionary with superfan statistics and insights
        """
        try:
            superfans = (
                self.db.query(Superfan)
                .filter(Superfan.artist_id == artist_id)
                .all()
            )

            if not superfans:
                return {
                    "total_superfans": 0,
                    "message": "No superfans identified yet",
                }

            # Calculate tier distribution
            tiers = {"platinum": 0, "gold": 0, "silver": 0, "bronze": 0}
            total_ltv = 0
            active_last_30_days = 0

            cutoff_date = datetime.utcnow() - timedelta(days=30)

            for superfan in superfans:
                tier = self._determine_tier(superfan.engagement_score or 0)
                tiers[tier] += 1

                total_ltv += superfan.lifetime_value or 0

                if superfan.last_interaction and superfan.last_interaction >= cutoff_date:
                    active_last_30_days += 1

            # Calculate averages
            avg_ltv = total_ltv / len(superfans) if superfans else 0
            avg_engagement = sum([s.engagement_score or 0 for s in superfans]) / len(superfans)

            # Get top locations
            location_counts = {}
            for superfan in superfans:
                if superfan.location:
                    location_counts[superfan.location] = location_counts.get(superfan.location, 0) + 1

            top_locations = sorted(
                [{"location": loc, "count": count} for loc, count in location_counts.items()],
                key=lambda x: x["count"],
                reverse=True,
            )[:5]

            return {
                "total_superfans": len(superfans),
                "active_last_30_days": active_last_30_days,
                "activity_rate": round((active_last_30_days / len(superfans)) * 100, 1) if superfans else 0,
                "tier_distribution": tiers,
                "average_lifetime_value": round(avg_ltv, 2),
                "average_engagement_score": round(avg_engagement, 2),
                "total_lifetime_value": round(total_ltv, 2),
                "top_locations": top_locations,
                "calculated_at": datetime.utcnow(),
            }

        except Exception as e:
            logger.error(f"Error getting superfan insights for artist {artist_id}: {e}")
            raise

    def track_superfan_growth(
        self,
        artist_id: str,
        months: int = 6,
    ) -> List[Dict[str, Any]]:
        """
        Track superfan growth over time

        Args:
            artist_id: Artist UUID
            months: Number of months to analyze

        Returns:
            List of monthly superfan counts
        """
        try:
            growth = []

            for i in range(months):
                month_start = datetime.utcnow() - timedelta(days=30 * (i + 1))
                month_end = datetime.utcnow() - timedelta(days=30 * i)

                # Count superfans created in this period
                count = (
                    self.db.query(func.count(Superfan.id))
                    .filter(
                        Superfan.artist_id == artist_id,
                        Superfan.created_at >= month_start,
                        Superfan.created_at < month_end,
                    )
                    .scalar()
                )

                growth.append({
                    "month": month_start.strftime("%Y-%m"),
                    "new_superfans": count,
                    "timestamp": month_start,
                })

            return list(reversed(growth))

        except Exception as e:
            logger.error(f"Error tracking superfan growth for artist {artist_id}: {e}")
            raise

    def get_superfan_segments(self, artist_id: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Segment superfans into actionable groups

        Segments:
        - At Risk: High engagement score but no recent activity
        - Champions: High engagement, high LTV
        - New & Promising: Recently added, showing high engagement
        - Need Nurturing: Low engagement, need activation
        """
        try:
            superfans = (
                self.db.query(Superfan)
                .filter(Superfan.artist_id == artist_id)
                .all()
            )

            segments = {
                "champions": [],
                "at_risk": [],
                "new_promising": [],
                "need_nurturing": [],
            }

            cutoff_date = datetime.utcnow() - timedelta(days=30)
            new_cutoff = datetime.utcnow() - timedelta(days=90)

            for superfan in superfans:
                engagement = superfan.engagement_score or 0
                ltv = superfan.lifetime_value or 0
                last_interaction = superfan.last_interaction
                created_at = superfan.created_at

                fan_data = {
                    "id": str(superfan.id),
                    "email": superfan.email,
                    "name": superfan.name,
                    "engagement_score": engagement,
                    "lifetime_value": ltv,
                }

                # Champions: High engagement + high LTV
                if engagement >= 8.0 and ltv >= 50:
                    segments["champions"].append(fan_data)

                # At Risk: High engagement but inactive
                elif engagement >= 7.0 and (not last_interaction or last_interaction < cutoff_date):
                    segments["at_risk"].append(fan_data)

                # New & Promising: Recently added with good engagement
                elif created_at >= new_cutoff and engagement >= 6.0:
                    segments["new_promising"].append(fan_data)

                # Need Nurturing: Low engagement
                elif engagement < 6.0:
                    segments["need_nurturing"].append(fan_data)

            return segments

        except Exception as e:
            logger.error(f"Error segmenting superfans for artist {artist_id}: {e}")
            raise

    def get_churn_risk(self, artist_id: str) -> Dict[str, Any]:
        """
        Calculate churn risk for superfans

        Returns fans at risk of churning (becoming inactive)
        """
        try:
            # Get superfans who haven't interacted recently
            cutoff_date = datetime.utcnow() - timedelta(days=30)
            warning_date = datetime.utcnow() - timedelta(days=60)

            at_risk = (
                self.db.query(Superfan)
                .filter(
                    Superfan.artist_id == artist_id,
                    Superfan.engagement_score >= 6.0,  # Was engaged
                    Superfan.last_interaction < cutoff_date,  # But inactive
                )
                .all()
            )

            critical_risk = [s for s in at_risk if s.last_interaction and s.last_interaction < warning_date]

            return {
                "total_at_risk": len(at_risk),
                "critical_risk": len(critical_risk),
                "churn_rate": round((len(at_risk) / self.db.query(func.count(Superfan.id)).filter(Superfan.artist_id == artist_id).scalar()) * 100, 1) if at_risk else 0,
                "at_risk_fans": [
                    {
                        "id": str(s.id),
                        "email": s.email,
                        "name": s.name,
                        "last_interaction": s.last_interaction,
                        "days_inactive": (datetime.utcnow() - s.last_interaction).days if s.last_interaction else None,
                        "engagement_score": s.engagement_score,
                    }
                    for s in at_risk[:10]  # Top 10
                ],
                "recommendation": "Re-engage these fans with exclusive content, shoutouts, or special offers.",
            }

        except Exception as e:
            logger.error(f"Error calculating churn risk for artist {artist_id}: {e}")
            raise
