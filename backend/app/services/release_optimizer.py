"""
Release Optimizer Service

Analyzes optimal release dates for music by considering:
- Artist momentum
- Competing releases
- Historical performance patterns
- Audience engagement
- Calendar events
"""
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
import logging
import calendar

from app.models.artist import Artist
from app.models.release import ReleaseScore, CompetingRelease
from app.models.stream_history import StreamHistory
from app.services.analytics.momentum import MomentumCalculator

logger = logging.getLogger(__name__)


class ReleaseOptimizer:
    """
    Calculates optimal release dates for artists

    Scoring factors (weighted):
    1. Artist Momentum (30%) - Current growth trajectory
    2. Competition Analysis (25%) - Other releases same day/week
    3. Historical Performance (20%) - Which days historically perform best
    4. Audience Readiness (15%) - Recent engagement levels
    5. Calendar Events (10%) - Major holidays, events to avoid
    """

    # Factor weights
    WEIGHT_MOMENTUM = 0.30
    WEIGHT_COMPETITION = 0.25
    WEIGHT_HISTORICAL = 0.20
    WEIGHT_AUDIENCE = 0.15
    WEIGHT_CALENDAR = 0.10

    # Thresholds
    MAJOR_ARTIST_FOLLOWERS = 1_000_000  # 1M+ followers = major artist
    HIGH_COMPETITION_THRESHOLD = 10  # 10+ similar releases = high competition
    OPTIMAL_SCORE_THRESHOLD = 7.5  # 7.5+ = green light
    RISKY_SCORE_THRESHOLD = 5.0  # < 5.0 = red flag

    def __init__(self, db: Session):
        self.db = db
        self.momentum_calc = MomentumCalculator()

    def calculate_release_scores(
        self,
        artist_id: str,
        weeks_ahead: int = 8
    ) -> List[ReleaseScore]:
        """
        Calculate scores for all Fridays in the next N weeks

        Args:
            artist_id: Artist UUID
            weeks_ahead: Number of weeks to analyze (default 8)

        Returns:
            List of ReleaseScore objects
        """
        artist = self.db.query(Artist).filter(Artist.id == artist_id).first()
        if not artist:
            raise ValueError(f"Artist {artist_id} not found")

        # Get all Fridays in the next N weeks
        fridays = self._get_next_fridays(weeks_ahead)

        scores = []
        for friday in fridays:
            try:
                score = self._score_single_date(artist, friday)
                scores.append(score)
            except Exception as e:
                logger.error(f"Failed to score {friday} for artist {artist_id}: {e}")

        return scores

    def _get_next_fridays(self, weeks: int) -> List[date]:
        """Get the next N Fridays starting from today"""
        fridays = []
        today = datetime.utcnow().date()

        # Find the next Friday
        days_ahead = (4 - today.weekday()) % 7  # Friday = 4
        if days_ahead == 0:  # Today is Friday
            days_ahead = 7  # Start from next Friday

        next_friday = today + timedelta(days=days_ahead)

        # Get N Fridays
        for i in range(weeks):
            fridays.append(next_friday + timedelta(weeks=i))

        return fridays

    def _score_single_date(self, artist: Artist, release_date: date) -> ReleaseScore:
        """
        Calculate comprehensive score for a single release date

        Returns:
            ReleaseScore object with all factors computed
        """
        # Calculate individual factor scores
        momentum_score = self._calculate_momentum_score(artist)
        competition_score, competition_data = self._calculate_competition_score(
            artist, release_date
        )
        historical_score = self._calculate_historical_score(artist, release_date)
        audience_score = self._calculate_audience_readiness_score(artist)
        calendar_score = self._calculate_calendar_score(release_date)

        # Calculate weighted overall score
        overall_score = (
            momentum_score * self.WEIGHT_MOMENTUM +
            competition_score * self.WEIGHT_COMPETITION +
            historical_score * self.WEIGHT_HISTORICAL +
            audience_score * self.WEIGHT_AUDIENCE +
            calendar_score * self.WEIGHT_CALENDAR
        )

        # Generate predictions
        predicted_streams = self._predict_first_week_streams(
            artist, overall_score, momentum_score
        )

        # Generate insights
        advantages, risks, recommendation = self._generate_insights(
            overall_score,
            momentum_score,
            competition_score,
            competition_data,
            calendar_score
        )

        # Create ReleaseScore object
        release_score = ReleaseScore(
            artist_id=artist.id,
            release_date=release_date,
            overall_score=round(overall_score, 2),
            momentum_score=round(momentum_score, 2),
            competition_score=round(competition_score, 2),
            historical_performance_score=round(historical_score, 2),
            audience_readiness_score=round(audience_score, 2),
            calendar_events_score=round(calendar_score, 2),
            competing_releases_count=competition_data["count"],
            major_competing_artists=competition_data["major_artists"],
            predicted_first_week_streams=predicted_streams["median"],
            confidence_interval_low=predicted_streams["low"],
            confidence_interval_high=predicted_streams["high"],
            advantages=advantages,
            risks=risks,
            recommendation=recommendation,
            data_snapshot={
                "artist_name": artist.name,
                "artist_genre": artist.genre,
                "calculation_date": datetime.utcnow().isoformat(),
            }
        )

        return release_score

    def _calculate_momentum_score(self, artist: Artist) -> float:
        """
        Calculate artist's current momentum score (0-10)

        Uses the existing momentum algorithm. Scale to 0-10.
        """
        try:
            # Get recent stream history
            recent_data = self.db.query(StreamHistory).filter(
                StreamHistory.artist_id == artist.id
            ).order_by(StreamHistory.timestamp.desc()).limit(90).all()

            if not recent_data:
                return 5.0  # Neutral score if no data

            # Calculate momentum using existing algorithm
            momentum_data = self.momentum_calc.calculate(recent_data)
            momentum_index = momentum_data.get("momentum_index", 5.0)

            # Momentum index is already 0-10, return as-is
            return max(0, min(10, momentum_index))

        except Exception as e:
            logger.error(f"Error calculating momentum score: {e}")
            return 5.0

    def _calculate_competition_score(
        self, artist: Artist, release_date: date
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Calculate competition score based on other releases same day/week (0-10)

        Higher score = less competition (better)

        Returns:
            Tuple of (score, competition_data_dict)
        """
        # Get competing releases for that date
        competing = self.db.query(CompetingRelease).filter(
            CompetingRelease.release_date == release_date
        ).all()

        # Filter by similar genre if artist has genre
        similar_genre_releases = []
        if artist.genre:
            for release in competing:
                if release.genres and artist.genre.lower() in [
                    g.lower() for g in release.genres
                ]:
                    similar_genre_releases.append(release)
        else:
            similar_genre_releases = competing

        # Count major artists (1M+ followers)
        major_artists = [
            r for r in similar_genre_releases
            if r.artist_followers and r.artist_followers >= self.MAJOR_ARTIST_FOLLOWERS
        ]

        competition_count = len(similar_genre_releases)
        major_count = len(major_artists)

        # Scoring logic
        if competition_count == 0:
            score = 10.0  # Perfect - no competition
        elif competition_count <= 3:
            score = 9.0 - (major_count * 0.5)  # Low competition
        elif competition_count <= 7:
            score = 7.0 - (major_count * 0.5)  # Moderate competition
        elif competition_count <= 15:
            score = 5.0 - (major_count * 0.3)  # High competition
        else:
            score = 3.0 - (major_count * 0.2)  # Very high competition

        score = max(0, min(10, score))

        competition_data = {
            "count": competition_count,
            "major_count": major_count,
            "major_artists": [
                {
                    "name": r.artist_name,
                    "followers": r.artist_followers,
                    "album": r.album_name
                }
                for r in major_artists[:5]  # Top 5 major competitors
            ]
        }

        return score, competition_data

    def _calculate_historical_score(self, artist: Artist, release_date: date) -> float:
        """
        Calculate score based on historical performance on this day of week (0-10)

        Analyzes if Fridays typically perform well for this artist.
        """
        # Get artist's historical stream data
        historical_data = self.db.query(StreamHistory).filter(
            StreamHistory.artist_id == artist.id,
            StreamHistory.timestamp >= datetime.utcnow() - timedelta(days=180)
        ).all()

        if not historical_data or len(historical_data) < 30:
            return 7.0  # Default good score for Fridays

        # Calculate average streams by day of week
        day_of_week = release_date.weekday()  # Friday = 4

        streams_by_day = {}
        for record in historical_data:
            day = record.timestamp.weekday()
            if day not in streams_by_day:
                streams_by_day[day] = []
            if record.monthly_listeners:
                streams_by_day[day].append(record.monthly_listeners)

        # Calculate average for each day
        day_averages = {}
        for day, streams in streams_by_day.items():
            if streams:
                day_averages[day] = sum(streams) / len(streams)

        if not day_averages:
            return 7.0

        # Check if this day performs better than average
        overall_avg = sum(day_averages.values()) / len(day_averages)
        this_day_avg = day_averages.get(day_of_week, overall_avg)

        # Score based on relative performance
        if this_day_avg >= overall_avg * 1.2:
            return 9.0  # This day is 20%+ better
        elif this_day_avg >= overall_avg * 1.1:
            return 8.0  # This day is 10%+ better
        elif this_day_avg >= overall_avg:
            return 7.0  # This day is average or slightly better
        elif this_day_avg >= overall_avg * 0.9:
            return 6.0  # Slightly below average
        else:
            return 5.0  # Below average

    def _calculate_audience_readiness_score(self, artist: Artist) -> float:
        """
        Calculate audience engagement level score (0-10)

        Based on recent fan engagement, social activity, etc.
        """
        # Get recent engagement metrics
        recent_streams = self.db.query(StreamHistory).filter(
            StreamHistory.artist_id == artist.id
        ).order_by(StreamHistory.timestamp.desc()).limit(30).all()

        if not recent_streams or len(recent_streams) < 7:
            return 6.0  # Neutral-positive score

        # Calculate trend in engagement
        first_week = recent_streams[-7:]
        last_week = recent_streams[:7]

        first_week_avg = sum(
            r.monthly_listeners or 0 for r in first_week
        ) / len(first_week)
        last_week_avg = sum(
            r.monthly_listeners or 0 for r in last_week
        ) / len(last_week)

        # Calculate growth rate
        if first_week_avg == 0:
            return 6.0

        growth_rate = ((last_week_avg - first_week_avg) / first_week_avg) * 100

        # Score based on growth
        if growth_rate >= 20:
            return 10.0  # Extremely engaged, growing fast
        elif growth_rate >= 10:
            return 9.0  # Strong growth
        elif growth_rate >= 5:
            return 8.0  # Good growth
        elif growth_rate >= 0:
            return 7.0  # Stable
        elif growth_rate >= -5:
            return 6.0  # Slight decline
        elif growth_rate >= -10:
            return 5.0  # Moderate decline
        else:
            return 4.0  # Significant decline

    def _calculate_calendar_score(self, release_date: date) -> float:
        """
        Calculate score based on calendar events (0-10)

        Avoids major holidays, big events where releases get buried.
        """
        # List of dates to avoid (major US holidays + global events)
        # This would be more comprehensive in production
        month = release_date.month
        day = release_date.day

        # Major holidays to avoid
        avoid_dates = [
            (12, 25),  # Christmas
            (12, 24),  # Christmas Eve
            (1, 1),    # New Year's Day
            (12, 31),  # New Year's Eve
            (7, 4),    # July 4th (US)
            (11, 27),  # Thanksgiving (varies, approximate)
        ]

        # Check if release is on or very close to avoided date
        for avoid_month, avoid_day in avoid_dates:
            if month == avoid_month and abs(day - avoid_day) <= 2:
                return 3.0  # Bad timing

        # Check for typical "dead zones"
        if month == 12 and day > 15:
            return 5.0  # Holiday season - competitive but can work

        if month in [6, 7, 8]:  # Summer
            return 8.0  # Good time, less competition typically

        if month in [1, 2]:  # Post-holiday slump
            return 9.0  # Great time, fresh start, less competition

        # Default - neutral good score
        return 7.0

    def _predict_first_week_streams(
        self, artist: Artist, overall_score: float, momentum_score: float
    ) -> Dict[str, int]:
        """
        Predict first week streams based on historical data + score

        Returns:
            Dict with median, low, and high estimates
        """
        # Get artist's recent average streams
        recent_data = self.db.query(StreamHistory).filter(
            StreamHistory.artist_id == artist.id
        ).order_by(StreamHistory.timestamp.desc()).limit(30).all()

        if not recent_data:
            # No data - return conservative estimates
            return {
                "median": 10000,
                "low": 5000,
                "high": 20000
            }

        # Calculate baseline from recent performance
        baseline_listeners = sum(
            r.monthly_listeners or 0 for r in recent_data
        ) / len(recent_data)

        # First week typically gets 2-4x the daily average
        daily_streams = baseline_listeners / 30  # Monthly to daily
        first_week_baseline = daily_streams * 7 * 2.5  # Week with 2.5x boost

        # Adjust based on overall score and momentum
        score_multiplier = 0.7 + (overall_score / 10) * 0.6  # 0.7 to 1.3
        momentum_multiplier = 0.8 + (momentum_score / 10) * 0.4  # 0.8 to 1.2

        median_prediction = int(first_week_baseline * score_multiplier * momentum_multiplier)

        # Calculate confidence interval (±30%)
        low_estimate = int(median_prediction * 0.7)
        high_estimate = int(median_prediction * 1.3)

        return {
            "median": median_prediction,
            "low": low_estimate,
            "high": high_estimate
        }

    def _generate_insights(
        self,
        overall_score: float,
        momentum_score: float,
        competition_score: float,
        competition_data: Dict[str, Any],
        calendar_score: float
    ) -> Tuple[List[str], List[str], str]:
        """
        Generate human-readable advantages, risks, and recommendation

        Returns:
            Tuple of (advantages_list, risks_list, recommendation_text)
        """
        advantages = []
        risks = []

        # Momentum insights
        if momentum_score >= 8:
            advantages.append("🔥 Your momentum is fire right now - capitalize on it!")
        elif momentum_score >= 6:
            advantages.append("📈 Solid upward momentum heading into release")
        elif momentum_score < 5:
            risks.append("📉 Current momentum is declining - consider building hype first")

        # Competition insights
        if competition_score >= 8:
            advantages.append(f"✅ Low competition - clear runway for your release")
        elif competition_score >= 6:
            advantages.append("👍 Moderate competition - still a good window")
        else:
            major_count = competition_data.get("major_count", 0)
            if major_count > 0:
                risks.append(
                    f"⚠️ {major_count} major artist(s) releasing same day - hard to break through"
                )
            risks.append(
                f"🚨 High competition with {competition_data['count']} similar releases"
            )

        # Calendar insights
        if calendar_score >= 8:
            advantages.append("📅 Great timing - no major events conflicting")
        elif calendar_score < 5:
            risks.append("🗓️ Major holiday/event nearby - could get buried")

        # Generate recommendation
        if overall_score >= self.OPTIMAL_SCORE_THRESHOLD:
            recommendation = "✅ GREEN LIGHT - This is an optimal release window"
        elif overall_score >= self.RISKY_SCORE_THRESHOLD:
            recommendation = "🟡 PROCEED WITH CAUTION - Decent date but some risk factors"
        else:
            recommendation = "🔴 NOT RECOMMENDED - Consider a different date"

        return advantages, risks, recommendation

    def get_competing_releases(
        self,
        release_date: date,
        genre: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get list of competing releases for a specific date

        Args:
            release_date: Date to check
            genre: Optional genre filter

        Returns:
            List of competing release info
        """
        query = self.db.query(CompetingRelease).filter(
            CompetingRelease.release_date == release_date
        )

        if genre:
            # Filter by genre (this is a simplified version)
            # In production, you'd use proper JSONB queries
            all_releases = query.all()
            filtered = [
                r for r in all_releases
                if r.genres and genre.lower() in [g.lower() for g in r.genres]
            ]
        else:
            filtered = query.all()

        return [
            {
                "artist_name": r.artist_name,
                "album_name": r.album_name,
                "album_type": r.album_type,
                "followers": r.artist_followers,
                "popularity": r.artist_popularity,
                "genres": r.genres,
                "is_major": r.is_major_release,
                "spotify_url": r.spotify_url,
            }
            for r in filtered
        ]
