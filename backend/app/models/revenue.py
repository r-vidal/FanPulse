"""Revenue Forecasting database models"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Integer, JSON, Date, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.core.database import Base


class ForecastScenario(str, enum.Enum):
    """Revenue forecast scenario types"""
    OPTIMISTIC = "optimistic"  # +40% from baseline
    REALISTIC = "realistic"     # Baseline prediction
    PESSIMISTIC = "pessimistic" # -40% from baseline


class RevenueForecast(Base):
    """
    Revenue predictions for artists

    Forecasts revenue for 3-12 months ahead using ML algorithms based on:
    - Historical streaming trends (CAGR)
    - Current momentum
    - Seasonal patterns
    - Engagement rates

    Generates 3 scenarios: optimistic, realistic, pessimistic
    """
    __tablename__ = "revenue_forecasts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("artists.id", ondelete="CASCADE"), nullable=False)

    # Forecast period
    forecast_month = Column(Date, nullable=False, index=True)  # First day of month
    scenario = Column(
        Enum(ForecastScenario, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )

    # Revenue breakdown (in EUR)
    streaming_revenue = Column(Float, nullable=False)
    concert_revenue = Column(Float, default=0.0)
    merch_revenue = Column(Float, default=0.0)
    sync_revenue = Column(Float, default=0.0)
    total_revenue = Column(Float, nullable=False)

    # Confidence metrics
    confidence_score = Column(Float)  # 0-1, how confident we are
    margin_of_error = Column(Float)   # Percentage (e.g., 0.20 = ±20%)

    # Model features used (for transparency)
    feature_data = Column(JSON)  # Historical metrics used in prediction

    # Metadata
    calculated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    model_version = Column(String, default="v1.0")

    # Relationships
    artist = relationship("Artist", backref="revenue_forecasts")

    def __repr__(self):
        return f"<RevenueForecast {self.forecast_month} - {self.scenario}: €{self.total_revenue:.2f}>"


class RevenueActual(Base):
    """
    Actual revenue data for measuring forecast accuracy

    Stores real revenue to compare against predictions and
    improve model accuracy over time.
    """
    __tablename__ = "revenue_actuals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("artists.id", ondelete="CASCADE"), nullable=False)

    # Revenue period
    revenue_month = Column(Date, nullable=False, index=True)  # First day of month

    # Actual revenue breakdown (in EUR)
    streaming_revenue = Column(Float, nullable=False)
    concert_revenue = Column(Float, default=0.0)
    merch_revenue = Column(Float, default=0.0)
    sync_revenue = Column(Float, default=0.0)
    other_revenue = Column(Float, default=0.0)
    total_revenue = Column(Float, nullable=False)

    # Stream data for calculation
    total_streams = Column(Integer)
    average_stream_rate = Column(Float)  # EUR per stream (typically €0.003-0.004)

    # Notes
    notes = Column(String)  # User can add context

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    artist = relationship("Artist", backref="revenue_actuals")

    def __repr__(self):
        return f"<RevenueActual {self.revenue_month}: €{self.total_revenue:.2f}>"


class ForecastAccuracy(Base):
    """
    Tracks forecast accuracy for model improvement

    Compares predictions vs actuals to measure and improve
    forecasting algorithm over time.
    """
    __tablename__ = "forecast_accuracy"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("artists.id", ondelete="CASCADE"), nullable=False)

    # Period being measured
    forecast_month = Column(Date, nullable=False, index=True)

    # Comparison
    predicted_revenue = Column(Float, nullable=False)  # Realistic scenario
    actual_revenue = Column(Float, nullable=False)
    accuracy_percentage = Column(Float)  # How close was prediction (0-100%)
    error_percentage = Column(Float)     # Percentage error (can be negative)

    # Was actual within confidence interval?
    within_confidence_interval = Column(Integer, default=0)  # Boolean as int

    # Metadata
    calculated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    model_version = Column(String)

    # Relationships
    artist = relationship("Artist", backref="forecast_accuracy_records")

    def __repr__(self):
        return f"<ForecastAccuracy {self.forecast_month}: {self.accuracy_percentage:.1f}% accurate>"
