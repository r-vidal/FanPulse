"""
Alert Detection Service

Monitors artist metrics and triggers alerts based on configured rules
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.artist import Artist
from app.models.alert import Alert, AlertType, AlertSeverity
from app.models.alert_rule import AlertRule, AlertRuleType, Notification
from app.services.analytics.fvs import FVSCalculator
from app.services.analytics.momentum import MomentumCalculator
from app.services.analytics.superfan import SuperfanAnalyzer
from app.models.social_post import SocialPost
from app.models.stream_history import StreamHistory
import logging

logger = logging.getLogger(__name__)


class AlertDetector:
    """Detects conditions and triggers alerts"""

    def __init__(self, db: Session):
        self.db = db
        self.fvs_calc = FVSCalculator(db)
        self.momentum_calc = MomentumCalculator(db)
        self.superfan_analyzer = SuperfanAnalyzer(db)

    def check_all_rules(self, artist_id: str) -> List[Alert]:
        """
        Check all active rules for an artist and trigger alerts

        Args:
            artist_id: Artist UUID

        Returns:
            List of newly created alerts
        """
        # Get all active alert rules for this artist
        rules = self.db.query(AlertRule).filter(
            AlertRule.artist_id == artist_id,
            AlertRule.is_active == True,
        ).all()

        new_alerts = []

        for rule in rules:
            # Check cooldown
            if rule.last_triggered_at:
                time_since_trigger = datetime.utcnow() - rule.last_triggered_at
                if time_since_trigger.total_seconds() < (rule.cooldown_hours * 3600):
                    logger.debug(f"Rule {rule.id} still in cooldown")
                    continue

            # Check if rule condition is met
            alert = self._check_rule(rule)
            if alert:
                new_alerts.append(alert)

                # Update last_triggered_at
                rule.last_triggered_at = datetime.utcnow()
                self.db.commit()

        return new_alerts

    def _check_rule(self, rule: AlertRule) -> Optional[Alert]:
        """
        Check a single rule and create alert if triggered

        Args:
            rule: Alert rule to check

        Returns:
            Alert if triggered, None otherwise
        """
        try:
            if rule.rule_type == AlertRuleType.MOMENTUM_SPIKE:
                return self._check_momentum_spike(rule)

            elif rule.rule_type == AlertRuleType.MOMENTUM_DROP:
                return self._check_momentum_drop(rule)

            elif rule.rule_type == AlertRuleType.FVS_THRESHOLD:
                return self._check_fvs_threshold(rule)

            elif rule.rule_type == AlertRuleType.FOLLOWER_MILESTONE:
                return self._check_follower_milestone(rule)

            elif rule.rule_type == AlertRuleType.VIRAL_POST:
                return self._check_viral_post(rule)

            elif rule.rule_type == AlertRuleType.ENGAGEMENT_DROP:
                return self._check_engagement_drop(rule)

            elif rule.rule_type == AlertRuleType.SUPERFAN_CHURN:
                return self._check_superfan_churn(rule)

            elif rule.rule_type == AlertRuleType.GROWTH_STALL:
                return self._check_growth_stall(rule)

            else:
                logger.warning(f"Unknown rule type: {rule.rule_type}")
                return None

        except Exception as e:
            logger.error(f"Error checking rule {rule.id}: {e}")
            return None

    def _check_momentum_spike(self, rule: AlertRule) -> Optional[Alert]:
        """Check if momentum index exceeds threshold"""
        momentum_data = self.momentum_calc.calculate_momentum(str(rule.artist_id), days=30)

        if self._compare_values(
            momentum_data["momentum_index"],
            rule.threshold_value,
            rule.comparison_operator,
        ):
            return self._create_alert(
                rule=rule,
                alert_type=AlertType.OPPORTUNITY,
                severity=AlertSeverity.URGENT if momentum_data["momentum_index"] >= 9 else AlertSeverity.WARNING,
                message=f"🚀 Momentum spike detected! Your artist's momentum index is {momentum_data['momentum_index']:.1f} ({momentum_data['status']})",
                data={
                    "momentum_index": momentum_data["momentum_index"],
                    "status": momentum_data["status"],
                    "breakdown": momentum_data["breakdown"],
                },
            )

        return None

    def _check_momentum_drop(self, rule: AlertRule) -> Optional[Alert]:
        """Check if momentum index drops below threshold"""
        momentum_data = self.momentum_calc.calculate_momentum(str(rule.artist_id), days=30)

        if self._compare_values(
            momentum_data["momentum_index"],
            rule.threshold_value,
            rule.comparison_operator,
        ):
            return self._create_alert(
                rule=rule,
                alert_type=AlertType.THREAT,
                severity=AlertSeverity.WARNING,
                message=f"⚠️ Momentum declining. Current index: {momentum_data['momentum_index']:.1f}. Consider boosting content strategy.",
                data={
                    "momentum_index": momentum_data["momentum_index"],
                    "status": momentum_data["status"],
                },
            )

        return None

    def _check_fvs_threshold(self, rule: AlertRule) -> Optional[Alert]:
        """Check if FVS crosses threshold"""
        fvs_data = self.fvs_calc.calculate_fvs(str(rule.artist_id), days=30)

        if self._compare_values(
            fvs_data["fvs"],
            rule.threshold_value,
            rule.comparison_operator,
        ):
            return self._create_alert(
                rule=rule,
                alert_type=AlertType.OPPORTUNITY if rule.comparison_operator in ["gt", "gte"] else AlertType.THREAT,
                severity=AlertSeverity.INFO,
                message=f"Fan Value Score is {fvs_data['fvs']:.1f}. Your fanbase quality is {'excellent' if fvs_data['fvs'] >= 80 else 'good' if fvs_data['fvs'] >= 60 else 'average'}.",
                data={"fvs": fvs_data["fvs"], "breakdown": fvs_data["breakdown"]},
            )

        return None

    def _check_follower_milestone(self, rule: AlertRule) -> Optional[Alert]:
        """Check if follower count reaches milestone"""
        # Get latest total followers
        latest_history = (
            self.db.query(StreamHistory)
            .filter(StreamHistory.artist_id == rule.artist_id)
            .order_by(StreamHistory.timestamp.desc())
            .limit(10)
            .all()
        )

        if not latest_history:
            return None

        total_followers = sum([h.followers or 0 for h in latest_history])

        if self._compare_values(total_followers, rule.threshold_value, rule.comparison_operator):
            return self._create_alert(
                rule=rule,
                alert_type=AlertType.OPPORTUNITY,
                severity=AlertSeverity.INFO,
                message=f"🎉 Milestone reached! {total_followers:,} total followers across all platforms!",
                data={"total_followers": total_followers},
            )

        return None

    def _check_viral_post(self, rule: AlertRule) -> Optional[Alert]:
        """Check for viral posts (high engagement spike)"""
        # Get recent posts (last 7 days)
        cutoff = datetime.utcnow() - timedelta(days=7)

        recent_posts = (
            self.db.query(SocialPost)
            .filter(
                SocialPost.artist_id == rule.artist_id,
                SocialPost.posted_at >= cutoff,
            )
            .all()
        )

        if not recent_posts:
            return None

        # Calculate average engagement
        engagements = [
            (p.likes or 0) + (p.comments or 0) + (p.shares or 0) for p in recent_posts
        ]

        if not engagements:
            return None

        avg_engagement = sum(engagements) / len(engagements)
        max_engagement = max(engagements)

        # Viral if max is 3x average
        if max_engagement > avg_engagement * 3 and max_engagement > 1000:
            viral_post = recent_posts[engagements.index(max_engagement)]

            return self._create_alert(
                rule=rule,
                alert_type=AlertType.VIRAL,
                severity=AlertSeverity.URGENT,
                message=f"🔥 Viral post detected! {max_engagement:,} total engagement ({max_engagement / avg_engagement:.1f}x average)!",
                data={
                    "post_id": str(viral_post.id),
                    "engagement": max_engagement,
                    "platform": str(viral_post.platform_connection_id),
                },
            )

        return None

    def _check_engagement_drop(self, rule: AlertRule) -> Optional[Alert]:
        """Check for sudden drop in engagement rate"""
        # Compare last 7 days vs previous 7 days
        now = datetime.utcnow()
        recent_cutoff = now - timedelta(days=7)
        previous_cutoff = now - timedelta(days=14)

        recent_posts = (
            self.db.query(SocialPost)
            .filter(
                SocialPost.artist_id == rule.artist_id,
                SocialPost.posted_at >= recent_cutoff,
            )
            .all()
        )

        previous_posts = (
            self.db.query(SocialPost)
            .filter(
                SocialPost.artist_id == rule.artist_id,
                SocialPost.posted_at >= previous_cutoff,
                SocialPost.posted_at < recent_cutoff,
            )
            .all()
        )

        if not recent_posts or not previous_posts:
            return None

        def calc_avg_engagement_rate(posts):
            rates = [p.engagement_rate for p in posts if p.engagement_rate]
            return sum(rates) / len(rates) if rates else 0

        recent_rate = calc_avg_engagement_rate(recent_posts)
        previous_rate = calc_avg_engagement_rate(previous_posts)

        if previous_rate == 0:
            return None

        drop_pct = ((previous_rate - recent_rate) / previous_rate) * 100

        if drop_pct > 30:  # 30% drop
            return self._create_alert(
                rule=rule,
                alert_type=AlertType.ENGAGEMENT_DROP,
                severity=AlertSeverity.WARNING,
                message=f"📉 Engagement dropped {drop_pct:.1f}% in the last week. Review content strategy.",
                data={
                    "recent_rate": recent_rate,
                    "previous_rate": previous_rate,
                    "drop_percentage": drop_pct,
                },
            )

        return None

    def _check_superfan_churn(self, rule: AlertRule) -> Optional[Alert]:
        """Check for superfan churn risk"""
        churn_data = self.superfan_analyzer.get_churn_risk(str(rule.artist_id))

        if churn_data["churn_rate"] > 20:  # More than 20% at risk
            return self._create_alert(
                rule=rule,
                alert_type=AlertType.THREAT,
                severity=AlertSeverity.WARNING,
                message=f"⚠️ {churn_data['total_at_risk']} superfans at risk of churning ({churn_data['churn_rate']}%).",
                data=churn_data,
            )

        return None

    def _check_growth_stall(self, rule: AlertRule) -> Optional[Alert]:
        """Check if growth rate has stalled"""
        # Get momentum to check if growth is declining
        momentum_data = self.momentum_calc.calculate_momentum(str(rule.artist_id), days=30)

        if momentum_data["breakdown"]["velocity"] < 3 and momentum_data["breakdown"]["acceleration"] < 3:
            return self._create_alert(
                rule=rule,
                alert_type=AlertType.THREAT,
                severity=AlertSeverity.WARNING,
                message="Growth has stalled. Time to refresh content strategy and re-engage your audience.",
                data={
                    "velocity": momentum_data["breakdown"]["velocity"],
                    "acceleration": momentum_data["breakdown"]["acceleration"],
                },
            )

        return None

    def _compare_values(self, value: float, threshold: float, operator: str) -> bool:
        """Compare values based on operator"""
        operators = {
            "gt": lambda v, t: v > t,
            "gte": lambda v, t: v >= t,
            "lt": lambda v, t: v < t,
            "lte": lambda v, t: v <= t,
            "eq": lambda v, t: v == t,
        }

        if operator not in operators:
            logger.warning(f"Unknown operator: {operator}")
            return False

        return operators[operator](value, threshold)

    def _create_alert(
        self,
        rule: AlertRule,
        alert_type: AlertType,
        severity: AlertSeverity,
        message: str,
        data: Dict[str, Any],
    ) -> Alert:
        """Create and save a new alert"""
        alert = Alert(
            user_id=rule.user_id,
            artist_id=rule.artist_id,
            alert_type=alert_type,
            severity=severity,
            message=message,
            data=data,
        )

        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)

        # Create notifications based on rule settings
        if rule.notify_in_app:
            self._create_in_app_notification(alert, rule)

        if rule.notify_email:
            self._create_email_notification(alert, rule)

        logger.info(f"Created alert {alert.id} for artist {rule.artist_id}")

        return alert

    def _create_in_app_notification(self, alert: Alert, rule: AlertRule):
        """Create in-app notification"""
        notification = Notification(
            user_id=rule.user_id,
            alert_id=alert.id,
            title=f"Alert: {rule.name}",
            message=alert.message,
            type="alert",
            channel="in_app",
        )

        self.db.add(notification)
        self.db.commit()

    def _create_email_notification(self, alert: Alert, rule: AlertRule):
        """Create email notification (queues email send)"""
        notification = Notification(
            user_id=rule.user_id,
            alert_id=alert.id,
            title=f"FanPulse Alert: {rule.name}",
            message=alert.message,
            type="alert",
            channel="email",
            data=alert.data,
        )

        self.db.add(notification)
        self.db.commit()

        # Queue email send task
        from app.tasks.email import send_alert_email
        send_alert_email.delay(str(notification.id))
