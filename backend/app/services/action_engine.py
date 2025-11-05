"""
Next Best Action Engine

AI-powered decision engine that analyzes artist data and generates
actionable recommendations prioritized by urgency and impact.

V1 Rules:
1. No historical data → Capture snapshots
2. Declining momentum → Analyze what changed
3. Fire momentum → Capitalize on growth
4. Low data quality → Improve tracking
5. Multiple artists → Focus on priority
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from uuid import UUID
from app.models.artist import Artist
from app.models.action import NextBestAction, ActionUrgency, ActionStatus
from app.models.stream_history import StreamHistory
from app.services.momentum import MomentumCalculator
from app.services.platforms.spotify import SpotifyService
import logging

logger = logging.getLogger(__name__)


class ActionEngine:
    """Generate next best actions for artists"""

    def __init__(self, db: Session):
        self.db = db

    async def generate_actions_for_artist(
        self,
        artist_id: str,
        user_id: str
    ) -> List[NextBestAction]:
        """
        Generate next best actions for a specific artist

        Returns list of actions sorted by urgency
        """
        # Convert string IDs to UUIDs for model compatibility
        artist_uuid = UUID(artist_id) if isinstance(artist_id, str) else artist_id
        user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id

        artist = self.db.query(Artist).filter(Artist.id == artist_uuid).first()
        if not artist:
            return []

        actions = []

        # Get historical data
        history = self._get_history(str(artist_uuid), days=30)
        recent_history = self._get_history(str(artist_uuid), days=7)

        # Get current stats and momentum
        current_stats = None
        momentum = None

        if artist.spotify_id:
            spotify = SpotifyService()
            try:
                access_token = await spotify.get_client_credentials_token()
                current_stats = await spotify.get_streaming_stats(
                    platform_artist_id=artist.spotify_id,
                    access_token=access_token
                )

                # Calculate momentum
                calculator = MomentumCalculator(self.db)
                momentum = calculator.calculate_momentum(
                    artist_id=str(artist_uuid),
                    current_stats=current_stats
                )
            except Exception as e:
                logger.error(f"Failed to fetch stats: {str(e)}")
            finally:
                await spotify.close()

        # Apply rules (pass UUIDs for proper model creation)
        actions.extend(self._rule_no_data(artist, history, artist_uuid, user_uuid))
        actions.extend(self._rule_insufficient_data(artist, history, artist_uuid, user_uuid))
        actions.extend(self._rule_declining_momentum(artist, momentum, artist_uuid, user_uuid))
        actions.extend(self._rule_fire_momentum(artist, momentum, artist_uuid, user_uuid))
        actions.extend(self._rule_stale_snapshot(artist, recent_history, artist_uuid, user_uuid))
        actions.extend(self._rule_high_popularity(artist, current_stats, artist_uuid, user_uuid))

        # Remove duplicates (same action_type)
        seen_types = set()
        unique_actions = []
        for action in actions:
            if action.action_type not in seen_types:
                seen_types.add(action.action_type)
                unique_actions.append(action)

        # Sort by urgency
        urgency_order = {
            ActionUrgency.CRITICAL: 0,
            ActionUrgency.HIGH: 1,
            ActionUrgency.MEDIUM: 2,
            ActionUrgency.LOW: 3
        }
        unique_actions.sort(key=lambda a: urgency_order[a.urgency])

        return unique_actions

    def _get_history(self, artist_id: str, days: int) -> List[StreamHistory]:
        """Get historical data for the last N days"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        # Convert string to UUID for comparison
        artist_uuid = UUID(artist_id) if isinstance(artist_id, str) else artist_id
        return self.db.query(StreamHistory).filter(
            StreamHistory.artist_id == artist_uuid,
            StreamHistory.timestamp >= cutoff_date
        ).order_by(StreamHistory.timestamp.desc()).all()

    def _rule_no_data(
        self,
        artist: Artist,
        history: List[StreamHistory],
        artist_uuid: UUID,
        user_uuid: UUID
    ) -> List[NextBestAction]:
        """Rule: Artist has no historical data at all"""
        if len(history) == 0:
            return [NextBestAction(
                artist_id=artist_uuid,
                user_id=user_uuid,
                action_type="start_tracking",
                title="🚀 Start Tracking Data",
                description=f"Capture your first data snapshot for {artist.name} to unlock momentum tracking, analytics, and forecasting.",
                urgency=ActionUrgency.HIGH,
                reason="No historical data found. Without data, we cannot calculate momentum or trends.",
                expected_impact="Unlock momentum index, trend analysis, and growth tracking for this artist.",
                status=ActionStatus.PENDING,
                created_at=datetime.utcnow()
            )]
        return []

    def _rule_insufficient_data(
        self,
        artist: Artist,
        history: List[StreamHistory],
        artist_uuid: UUID,
        user_uuid: UUID
    ) -> List[NextBestAction]:
        """Rule: Artist has <7 data points"""
        if 0 < len(history) < 7:
            return [NextBestAction(
                artist_id=artist_uuid,
                user_id=user_uuid,
                action_type="improve_data_quality",
                title="📊 Improve Data Quality",
                description=f"Capture daily snapshots for {artist.name} to improve momentum accuracy. Current: {len(history)} data points, recommended: 7+.",
                urgency=ActionUrgency.MEDIUM,
                reason=f"Only {len(history)} data points available. More data = better insights.",
                expected_impact="More accurate momentum scores and trend predictions.",
                status=ActionStatus.PENDING,
                created_at=datetime.utcnow()
            )]
        return []

    def _rule_declining_momentum(
        self,
        artist: Artist,
        momentum: Optional[Dict[str, Any]],
        artist_uuid: UUID,
        user_uuid: UUID
    ) -> List[NextBestAction]:
        """Rule: Momentum status is 'declining'"""
        if momentum and momentum.get('status') == 'declining':
            return [NextBestAction(
                artist_id=artist_uuid,
                user_id=user_uuid,
                action_type="analyze_decline",
                title="⚠️ Investigate Momentum Drop",
                description=f"{artist.name}'s momentum is declining (score: {momentum['score']}/10). Analyze recent activity and engagement.",
                urgency=ActionUrgency.HIGH,
                reason=f"Momentum score dropped to {momentum['score']}/10. Trend: {momentum.get('trend_30d', 0):.1f}%",
                expected_impact="Identify causes of decline and implement recovery strategies.",
                status=ActionStatus.PENDING,
                created_at=datetime.utcnow()
            )]
        return []

    def _rule_fire_momentum(
        self,
        artist: Artist,
        momentum: Optional[Dict[str, Any]],
        artist_uuid: UUID,
        user_uuid: UUID
    ) -> List[NextBestAction]:
        """Rule: Momentum status is 'fire' (>7)"""
        if momentum and momentum.get('status') == 'fire':
            return [NextBestAction(
                artist_id=artist_uuid,
                user_id=user_uuid,
                action_type="capitalize_momentum",
                title="🔥 Capitalize on Fire Momentum!",
                description=f"{artist.name} is ON FIRE! (score: {momentum['score']}/10). NOW is the time to release content, book shows, and amplify marketing.",
                urgency=ActionUrgency.CRITICAL,
                reason=f"Momentum score at {momentum['score']}/10. Strike while hot!",
                expected_impact="Maximize growth during peak momentum window. 2-3x potential reach.",
                status=ActionStatus.PENDING,
                created_at=datetime.utcnow()
            )]
        return []

    def _rule_stale_snapshot(
        self,
        artist: Artist,
        recent_history: List[StreamHistory],
        artist_uuid: UUID,
        user_uuid: UUID
    ) -> List[NextBestAction]:
        """Rule: No snapshot in last 3 days"""
        if len(recent_history) == 0 or (
            len(recent_history) > 0 and
            (datetime.utcnow() - recent_history[0].timestamp).days >= 3
        ):
            return [NextBestAction(
                artist_id=artist_uuid,
                user_id=user_uuid,
                action_type="capture_snapshot",
                title="📸 Capture Fresh Data",
                description=f"It's been 3+ days since last snapshot for {artist.name}. Capture current stats to keep trends accurate.",
                urgency=ActionUrgency.MEDIUM,
                reason="Stale data leads to inaccurate momentum calculations.",
                expected_impact="Keep momentum tracking current and accurate.",
                status=ActionStatus.PENDING,
                created_at=datetime.utcnow()
            )]
        return []

    def _rule_high_popularity(
        self,
        artist: Artist,
        current_stats: Optional[Dict[str, Any]],
        artist_uuid: UUID,
        user_uuid: UUID
    ) -> List[NextBestAction]:
        """Rule: High popularity (>80) but no backup export"""
        if current_stats and current_stats.get('popularity', 0) >= 80:
            return [NextBestAction(
                artist_id=artist_uuid,
                user_id=user_uuid,
                action_type="export_backup",
                title="💾 Backup Your Data",
                description=f"{artist.name} has high popularity ({current_stats['popularity']}/100). Export data regularly to prevent data loss.",
                urgency=ActionUrgency.LOW,
                reason="High-value artist data should be backed up regularly.",
                expected_impact="Secure historical data for long-term analysis.",
                status=ActionStatus.PENDING,
                created_at=datetime.utcnow()
            )]
        return []
