"""
Revenue Forecasting Service

Predicts artist revenue for 3-12 months ahead using:
- Historical streaming trends
- Current momentum
- Seasonal patterns
- Engagement metrics

Generates 3 scenarios: optimistic, realistic, pessimistic
"""
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
import logging
import calendar

from app.models.artist import Artist
from app.models.revenue import RevenueForecast, RevenueActual, ForecastScenario
from app.models.stream_history import StreamHistory
from app.services.analytics.momentum import MomentumCalculator

logger = logging.getLogger(__name__)


class RevenueForecaster:
    """
    Forecasts artist revenue using time-series analysis

    Algorithm:
    1. Calculate baseline from historical streams
    2. Compute growth rate (CAGR) over 6 months
    3. Apply momentum adjustment
    4. Apply seasonal factors
    5. Generate 3 scenarios (optimistic/realistic/pessimistic)
    """

    # Revenue rates (EUR per stream)
    AVG_STREAM_RATE = 0.0035  # €0.0035 per stream (industry average)
    SPOTIFY_RATE = 0.004       # Spotify typically higher
    APPLE_MUSIC_RATE = 0.007   # Apple Music even higher

    # Scenario multipliers
    OPTIMISTIC_MULTIPLIER = 1.40   # +40%
    PESSIMISTIC_MULTIPLIER = 0.60  # -40%

    # Seasonal factors (multipliers by month)
    SEASONAL_FACTORS = {
        1: 0.95,   # January - Post-holiday slump
        2: 0.92,   # February - Lowest month
        3: 0.98,   # March - Recovery
        4: 1.00,   # April - Neutral
        5: 1.02,   # May - Spring boost
        6: 1.05,   # June - Summer start
        7: 1.08,   # July - Peak summer
        8: 1.06,   # August - Still strong
        9: 1.00,   # September - Back to school
        10: 1.02,  # October - Fall boost
        11: 1.05,  # November - Pre-holiday
        12: 1.10,  # December - Holiday peak
    }

    # Concert revenue estimation (based on momentum)
    CONCERT_BASE_MULTIPLIER = 0.15  # Concerts = ~15% of streaming rev for emerging artists
    CONCERT_GROWTH_FACTOR = 1.5     # Grows faster when momentum is high

    # Merch revenue estimation
    MERCH_BASE_MULTIPLIER = 0.08    # Merch = ~8% of streaming rev

    def __init__(self, db: Session):
        self.db = db
        self.momentum_calc = MomentumCalculator()

    def forecast_revenue(
        self,
        artist_id: str,
        months_ahead: int = 12
    ) -> Dict[str, List[RevenueForecast]]:
        """
        Generate revenue forecasts for next N months

        Args:
            artist_id: Artist UUID
            months_ahead: Number of months to forecast (3-12)

        Returns:
            Dict with 3 scenario lists: optimistic, realistic, pessimistic
        """
        artist = self.db.query(Artist).filter(Artist.id == artist_id).first()
        if not artist:
            raise ValueError(f"Artist {artist_id} not found")

        # Get historical data
        historical_data = self._get_historical_data(artist_id)

        if not historical_data or len(historical_data) < 30:
            logger.warning(f"Insufficient data for forecasting artist {artist_id}")
            # Return conservative estimates
            return self._generate_conservative_forecast(artist, months_ahead)

        # Calculate baseline metrics
        baseline_metrics = self._calculate_baseline_metrics(historical_data)

        # Calculate growth rate (CAGR)
        growth_rate = self._calculate_growth_rate(historical_data)

        # Get current momentum
        momentum_score = self._get_momentum_score(historical_data)

        # Generate forecasts for each scenario
        forecasts = {
            "optimistic": [],
            "realistic": [],
            "pessimistic": []
        }

        today = datetime.utcnow().date()
        for month_offset in range(1, months_ahead + 1):
            # Calculate target month
            year = today.year
            month = today.month + month_offset
            while month > 12:
                month -= 12
                year += 1

            forecast_month = date(year, month, 1)

            # Generate forecast for this month (all 3 scenarios)
            month_forecasts = self._forecast_single_month(
                artist=artist,
                forecast_month=forecast_month,
                baseline_metrics=baseline_metrics,
                growth_rate=growth_rate,
                momentum_score=momentum_score,
                months_ahead=month_offset
            )

            forecasts["optimistic"].append(month_forecasts["optimistic"])
            forecasts["realistic"].append(month_forecasts["realistic"])
            forecasts["pessimistic"].append(month_forecasts["pessimistic"])

        return forecasts

    def _get_historical_data(self, artist_id: str) -> List[StreamHistory]:
        """Get last 6 months of stream history"""
        six_months_ago = datetime.utcnow() - timedelta(days=180)

        return self.db.query(StreamHistory).filter(
            StreamHistory.artist_id == artist_id,
            StreamHistory.timestamp >= six_months_ago
        ).order_by(StreamHistory.timestamp.asc()).all()

    def _calculate_baseline_metrics(self, historical_data: List[StreamHistory]) -> Dict[str, float]:
        """Calculate baseline metrics from historical data"""
        # Get recent 30 days average
        recent_30_days = historical_data[-30:] if len(historical_data) >= 30 else historical_data

        total_listeners = sum(h.monthly_listeners or 0 for h in recent_30_days)
        total_followers = sum(h.followers or 0 for h in recent_30_days)

        avg_monthly_listeners = total_listeners / len(recent_30_days) if recent_30_days else 0
        avg_followers = total_followers / len(recent_30_days) if recent_30_days else 0

        # Estimate streams from monthly listeners
        # Assumption: Monthly listeners × 10 streams/month on average
        estimated_monthly_streams = avg_monthly_listeners * 10

        return {
            "monthly_listeners": avg_monthly_listeners,
            "followers": avg_followers,
            "estimated_monthly_streams": estimated_monthly_streams,
            "baseline_revenue": estimated_monthly_streams * self.AVG_STREAM_RATE
        }

    def _calculate_growth_rate(self, historical_data: List[StreamHistory]) -> float:
        """
        Calculate Compound Annual Growth Rate (CAGR)

        CAGR = (Ending Value / Beginning Value)^(1/periods) - 1
        """
        if len(historical_data) < 60:  # Need at least 2 months of data
            return 0.0

        # Split into first and last 30 days
        first_30 = historical_data[:30]
        last_30 = historical_data[-30:]

        first_avg = sum(h.monthly_listeners or 0 for h in first_30) / 30
        last_avg = sum(h.monthly_listeners or 0 for h in last_30) / 30

        if first_avg == 0:
            return 0.0

        # Calculate growth over the period
        months_elapsed = len(historical_data) / 30

        if months_elapsed < 1:
            months_elapsed = 1

        # CAGR formula
        cagr = (last_avg / first_avg) ** (1 / months_elapsed) - 1

        # Cap at reasonable values (-50% to +200% per month)
        cagr = max(-0.50, min(2.0, cagr))

        return cagr

    def _get_momentum_score(self, historical_data: List[StreamHistory]) -> float:
        """Get current momentum score (0-10)"""
        try:
            momentum_data = self.momentum_calc.calculate(historical_data)
            return momentum_data.get("momentum_index", 5.0)
        except Exception as e:
            logger.error(f"Error calculating momentum: {e}")
            return 5.0

    def _forecast_single_month(
        self,
        artist: Artist,
        forecast_month: date,
        baseline_metrics: Dict[str, float],
        growth_rate: float,
        momentum_score: float,
        months_ahead: int
    ) -> Dict[str, RevenueForecast]:
        """
        Generate forecast for a single month (all 3 scenarios)

        Returns:
            Dict with optimistic, realistic, pessimistic forecasts
        """
        # Apply growth rate
        growth_factor = (1 + growth_rate) ** months_ahead

        # Apply momentum adjustment (momentum 0-10 → multiplier 0.8-1.2)
        momentum_factor = 0.8 + (momentum_score / 10) * 0.4

        # Apply seasonal factor
        seasonal_factor = self.SEASONAL_FACTORS.get(forecast_month.month, 1.0)

        # Calculate realistic baseline revenue
        realistic_streams = baseline_metrics["estimated_monthly_streams"] * growth_factor * momentum_factor * seasonal_factor
        realistic_streaming_revenue = realistic_streams * self.AVG_STREAM_RATE

        # Estimate other revenue sources
        concert_multiplier = self.CONCERT_BASE_MULTIPLIER
        if momentum_score >= 7:  # High momentum = more concert opportunities
            concert_multiplier *= self.CONCERT_GROWTH_FACTOR

        realistic_concert_revenue = realistic_streaming_revenue * concert_multiplier
        realistic_merch_revenue = realistic_streaming_revenue * self.MERCH_BASE_MULTIPLIER
        realistic_total = realistic_streaming_revenue + realistic_concert_revenue + realistic_merch_revenue

        # Calculate confidence (decreases over time)
        confidence = max(0.5, 0.95 - (months_ahead * 0.05))
        margin_of_error = min(0.40, 0.15 + (months_ahead * 0.025))

        # Generate 3 scenarios
        scenarios = {}

        for scenario_type in [ForecastScenario.REALISTIC, ForecastScenario.OPTIMISTIC, ForecastScenario.PESSIMISTIC]:
            if scenario_type == ForecastScenario.OPTIMISTIC:
                multiplier = self.OPTIMISTIC_MULTIPLIER
            elif scenario_type == ForecastScenario.PESSIMISTIC:
                multiplier = self.PESSIMISTIC_MULTIPLIER
            else:
                multiplier = 1.0

            forecast = RevenueForecast(
                artist_id=artist.id,
                forecast_month=forecast_month,
                scenario=scenario_type,
                streaming_revenue=realistic_streaming_revenue * multiplier,
                concert_revenue=realistic_concert_revenue * multiplier,
                merch_revenue=realistic_merch_revenue * multiplier,
                sync_revenue=0.0,  # Sync licensing is unpredictable
                total_revenue=realistic_total * multiplier,
                confidence_score=confidence,
                margin_of_error=margin_of_error,
                feature_data={
                    "baseline_monthly_listeners": baseline_metrics["monthly_listeners"],
                    "growth_rate": growth_rate,
                    "momentum_score": momentum_score,
                    "months_ahead": months_ahead,
                    "seasonal_factor": seasonal_factor,
                    "estimated_streams": realistic_streams * multiplier,
                },
                model_version="v1.0"
            )

            scenarios[scenario_type.value] = forecast

        return scenarios

    def _generate_conservative_forecast(
        self,
        artist: Artist,
        months_ahead: int
    ) -> Dict[str, List[RevenueForecast]]:
        """
        Generate conservative forecast when insufficient data

        Uses industry averages for emerging artists
        """
        # Conservative baseline: 10,000 monthly listeners
        baseline_listeners = 10000
        baseline_streams = baseline_listeners * 10
        baseline_revenue = baseline_streams * self.AVG_STREAM_RATE

        forecasts = {
            "optimistic": [],
            "realistic": [],
            "pessimistic": []
        }

        today = datetime.utcnow().date()
        for month_offset in range(1, months_ahead + 1):
            year = today.year
            month = today.month + month_offset
            while month > 12:
                month -= 12
                year += 1

            forecast_month = date(year, month, 1)
            seasonal_factor = self.SEASONAL_FACTORS.get(month, 1.0)

            # Very conservative growth (2% per month)
            growth_factor = 1.02 ** month_offset

            realistic_revenue = baseline_revenue * growth_factor * seasonal_factor

            for scenario_type in [ForecastScenario.REALISTIC, ForecastScenario.OPTIMISTIC, ForecastScenario.PESSIMISTIC]:
                if scenario_type == ForecastScenario.OPTIMISTIC:
                    multiplier = self.OPTIMISTIC_MULTIPLIER
                elif scenario_type == ForecastScenario.PESSIMISTIC:
                    multiplier = self.PESSIMISTIC_MULTIPLIER
                else:
                    multiplier = 1.0

                forecast = RevenueForecast(
                    artist_id=artist.id,
                    forecast_month=forecast_month,
                    scenario=scenario_type,
                    streaming_revenue=realistic_revenue * multiplier,
                    concert_revenue=realistic_revenue * 0.10 * multiplier,
                    merch_revenue=realistic_revenue * 0.05 * multiplier,
                    sync_revenue=0.0,
                    total_revenue=realistic_revenue * 1.15 * multiplier,
                    confidence_score=0.50,  # Low confidence
                    margin_of_error=0.40,   # High margin of error
                    feature_data={
                        "note": "Conservative estimate - insufficient historical data",
                        "baseline_assumption": baseline_listeners,
                    },
                    model_version="v1.0_conservative"
                )

                forecasts[scenario_type.value].append(forecast)

        return forecasts

    def save_forecasts(
        self,
        forecasts: Dict[str, List[RevenueForecast]]
    ) -> int:
        """
        Save forecasts to database

        Returns:
            Number of forecasts saved
        """
        saved_count = 0

        for scenario_type, forecast_list in forecasts.items():
            for forecast in forecast_list:
                # Check if forecast already exists
                existing = self.db.query(RevenueForecast).filter(
                    RevenueForecast.artist_id == forecast.artist_id,
                    RevenueForecast.forecast_month == forecast.forecast_month,
                    RevenueForecast.scenario == forecast.scenario
                ).first()

                if existing:
                    # Update existing
                    existing.streaming_revenue = forecast.streaming_revenue
                    existing.concert_revenue = forecast.concert_revenue
                    existing.merch_revenue = forecast.merch_revenue
                    existing.total_revenue = forecast.total_revenue
                    existing.confidence_score = forecast.confidence_score
                    existing.margin_of_error = forecast.margin_of_error
                    existing.feature_data = forecast.feature_data
                    existing.calculated_at = datetime.utcnow()
                else:
                    # Add new
                    self.db.add(forecast)

                saved_count += 1

        self.db.commit()
        return saved_count
