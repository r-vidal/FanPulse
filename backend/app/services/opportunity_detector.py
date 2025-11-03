"""Opportunity Detection Service for Real-time Alerts"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.artist import Artist
from app.models.stream_history import StreamHistory
from app.models.alert import Alert, AlertType, AlertSeverity

logger = logging.getLogger(__name__)


class OpportunityDetector:
    """
    Detects opportunities and important moments for artists

    Analyzes streaming data, growth patterns, and other metrics
    to identify actionable opportunities in real-time.
    """

    # Thresholds for opportunity detection
    VIRAL_GROWTH_THRESHOLD = 50  # 50% growth in 24h
    MOMENTUM_SPIKE_THRESHOLD = 30  # 30% growth in 7 days
    PLATEAU_DETECTION_DAYS = 14  # Check for plateau over 14 days
    MIN_STREAMS_FOR_ANALYSIS = 1000  # Minimum streams to analyze

    def __init__(self, db: Session):
        self.db = db

    def detect_all_opportunities(self, user_id: str) -> List[Dict]:
        """
        Detect all opportunities for a user's artists

        Args:
            user_id: User UUID

        Returns:
            List of detected opportunities
        """
        opportunities = []

        # Get all user's artists
        artists = self.db.query(Artist).filter(Artist.user_id == user_id).all()

        for artist in artists:
            # Check various opportunity types
            opportunities.extend(self._detect_viral_growth(artist))
            opportunities.extend(self._detect_momentum_spike(artist))
            opportunities.extend(self._detect_plateau_break(artist))
            opportunities.extend(self._detect_optimal_release_window(artist))
            opportunities.extend(self._detect_milestone_approaching(artist))

        return opportunities

    def _detect_viral_growth(self, artist: Artist) -> List[Dict]:
        """
        Detect viral growth patterns (>50% growth in 24h)

        Args:
            artist: Artist model

        Returns:
            List of opportunities
        """
        opportunities = []

        try:
            # Get last 2 days of data
            yesterday = datetime.utcnow() - timedelta(days=1)
            two_days_ago = datetime.utcnow() - timedelta(days=2)

            recent = self.db.query(StreamHistory).filter(
                StreamHistory.artist_id == artist.id,
                StreamHistory.date >= yesterday,
            ).first()

            previous = self.db.query(StreamHistory).filter(
                StreamHistory.artist_id == artist.id,
                StreamHistory.date >= two_days_ago,
                StreamHistory.date < yesterday,
            ).first()

            if recent and previous and previous.total_streams > 0:
                growth_rate = ((recent.total_streams - previous.total_streams) / previous.total_streams) * 100

                if growth_rate >= self.VIRAL_GROWTH_THRESHOLD:
                    opportunities.append({
                        "type": "viral_growth",
                        "artist_id": str(artist.id),
                        "artist_name": artist.name,
                        "priority": "high",
                        "title": f"🚀 Viral Growth Alert: {artist.name}",
                        "message": f"{artist.name} is experiencing viral growth with {growth_rate:.1f}% increase in 24h!",
                        "data": {
                            "growth_rate": round(growth_rate, 1),
                            "current_streams": recent.total_streams,
                            "previous_streams": previous.total_streams,
                        },
                        "actions": [
                            "Boost social media promotion",
                            "Engage with new fans",
                            "Consider releasing new content",
                        ],
                    })

        except Exception as e:
            logger.error(f"Error detecting viral growth for {artist.id}: {e}")

        return opportunities

    def _detect_momentum_spike(self, artist: Artist) -> List[Dict]:
        """
        Detect momentum spikes (significant 7-day growth)

        Args:
            artist: Artist model

        Returns:
            List of opportunities
        """
        opportunities = []

        try:
            # Get last 14 days
            week_ago = datetime.utcnow() - timedelta(days=7)
            two_weeks_ago = datetime.utcnow() - timedelta(days=14)

            # Last 7 days
            recent_week = self.db.query(func.sum(StreamHistory.total_streams)).filter(
                StreamHistory.artist_id == artist.id,
                StreamHistory.date >= week_ago,
            ).scalar() or 0

            # Previous 7 days
            previous_week = self.db.query(func.sum(StreamHistory.total_streams)).filter(
                StreamHistory.artist_id == artist.id,
                StreamHistory.date >= two_weeks_ago,
                StreamHistory.date < week_ago,
            ).scalar() or 0

            if previous_week > self.MIN_STREAMS_FOR_ANALYSIS and previous_week > 0:
                growth_rate = ((recent_week - previous_week) / previous_week) * 100

                if growth_rate >= self.MOMENTUM_SPIKE_THRESHOLD:
                    opportunities.append({
                        "type": "momentum_spike",
                        "artist_id": str(artist.id),
                        "artist_name": artist.name,
                        "priority": "medium",
                        "title": f"📈 Momentum Building: {artist.name}",
                        "message": f"{artist.name} is gaining momentum with {growth_rate:.1f}% growth this week!",
                        "data": {
                            "growth_rate": round(growth_rate, 1),
                            "recent_week_streams": recent_week,
                            "previous_week_streams": previous_week,
                        },
                        "actions": [
                            "Increase playlist pitching",
                            "Schedule content releases",
                            "Analyze successful tracks",
                        ],
                    })

        except Exception as e:
            logger.error(f"Error detecting momentum spike for {artist.id}: {e}")

        return opportunities

    def _detect_plateau_break(self, artist: Artist) -> List[Dict]:
        """
        Detect when an artist breaks out of a plateau

        Args:
            artist: Artist model

        Returns:
            List of opportunities
        """
        opportunities = []

        try:
            # Get last 21 days
            three_weeks_ago = datetime.utcnow() - timedelta(days=21)

            history = self.db.query(StreamHistory).filter(
                StreamHistory.artist_id == artist.id,
                StreamHistory.date >= three_weeks_ago,
            ).order_by(StreamHistory.date).all()

            if len(history) < 21:
                return opportunities

            # Check for plateau (first 14 days stable)
            first_14_days = history[:14]
            avg_first_14 = sum(h.total_streams for h in first_14_days) / 14

            # Check variance in first 14 days
            variance = sum((h.total_streams - avg_first_14) ** 2 for h in first_14_days) / 14
            is_plateau = variance < (avg_first_14 * 0.1)  # Low variance = plateau

            if is_plateau:
                # Check if last 7 days show growth
                last_7_days = history[-7:]
                avg_last_7 = sum(h.total_streams for h in last_7_days) / 7

                if avg_last_7 > avg_first_14 * 1.15:  # 15% increase
                    growth = ((avg_last_7 - avg_first_14) / avg_first_14) * 100

                    opportunities.append({
                        "type": "plateau_break",
                        "artist_id": str(artist.id),
                        "artist_name": artist.name,
                        "priority": "high",
                        "title": f"🎯 Breakthrough Moment: {artist.name}",
                        "message": f"{artist.name} is breaking out of a plateau with {growth:.1f}% growth!",
                        "data": {
                            "growth_rate": round(growth, 1),
                            "plateau_avg": int(avg_first_14),
                            "current_avg": int(avg_last_7),
                        },
                        "actions": [
                            "Capitalize with new release",
                            "Increase marketing budget",
                            "Engage with growing audience",
                        ],
                    })

        except Exception as e:
            logger.error(f"Error detecting plateau break for {artist.id}: {e}")

        return opportunities

    def _detect_optimal_release_window(self, artist: Artist) -> List[Dict]:
        """
        Detect optimal windows for releasing new music

        Args:
            artist: Artist model

        Returns:
            List of opportunities
        """
        opportunities = []

        try:
            # Get last 30 days
            month_ago = datetime.utcnow() - timedelta(days=30)

            total_streams = self.db.query(func.sum(StreamHistory.total_streams)).filter(
                StreamHistory.artist_id == artist.id,
                StreamHistory.date >= month_ago,
            ).scalar() or 0

            # If streams are consistently high, it's a good release window
            if total_streams > 100000:  # 100k+ streams in last 30 days
                avg_daily = total_streams / 30

                opportunities.append({
                    "type": "optimal_release_window",
                    "artist_id": str(artist.id),
                    "artist_name": artist.name,
                    "priority": "medium",
                    "title": f"⏰ Perfect Release Window: {artist.name}",
                    "message": f"{artist.name} has strong momentum - ideal time for a new release!",
                    "data": {
                        "monthly_streams": total_streams,
                        "avg_daily_streams": int(avg_daily),
                    },
                    "actions": [
                        "Schedule new single release",
                        "Prepare marketing campaign",
                        "Pre-save campaign",
                    ],
                })

        except Exception as e:
            logger.error(f"Error detecting release window for {artist.id}: {e}")

        return opportunities

    def _detect_milestone_approaching(self, artist: Artist) -> List[Dict]:
        """
        Detect when artist is approaching significant milestones

        Args:
            artist: Artist model

        Returns:
            List of opportunities
        """
        opportunities = []

        try:
            # Get total streams
            total_streams = self.db.query(func.sum(StreamHistory.total_streams)).filter(
                StreamHistory.artist_id == artist.id,
            ).scalar() or 0

            # Define milestones
            milestones = [
                (10000, "10K"),
                (50000, "50K"),
                (100000, "100K"),
                (500000, "500K"),
                (1000000, "1M"),
                (5000000, "5M"),
                (10000000, "10M"),
            ]

            for milestone_value, milestone_name in milestones:
                # Check if within 10% of milestone
                if milestone_value * 0.9 < total_streams < milestone_value:
                    remaining = milestone_value - total_streams

                    opportunities.append({
                        "type": "milestone_approaching",
                        "artist_id": str(artist.id),
                        "artist_name": artist.name,
                        "priority": "low",
                        "title": f"🎉 Milestone Alert: {artist.name}",
                        "message": f"{artist.name} is just {remaining:,} streams away from {milestone_name}!",
                        "data": {
                            "current_streams": total_streams,
                            "milestone": milestone_value,
                            "milestone_name": milestone_name,
                            "remaining": remaining,
                        },
                        "actions": [
                            "Announce to fans",
                            "Run promotion campaign",
                            "Celebrate achievement",
                        ],
                    })
                    break  # Only one milestone at a time

        except Exception as e:
            logger.error(f"Error detecting milestone for {artist.id}: {e}")

        return opportunities


# Singleton factory
def get_opportunity_detector(db: Session) -> OpportunityDetector:
    """Get opportunity detector instance"""
    return OpportunityDetector(db)
