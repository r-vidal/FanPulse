"""Add revenue forecasting models

Revision ID: 004_revenue_forecasting
Revises: 003_release_optimizer
Create Date: 2025-11-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004_revenue_forecasting'
down_revision = '003_release_optimizer'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum for forecast scenarios
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE forecastscenario AS ENUM ('optimistic', 'realistic', 'pessimistic');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Reference the ENUM type
    forecast_scenario_enum = postgresql.ENUM(
        'optimistic', 'realistic', 'pessimistic',
        name='forecastscenario',
        create_type=False
    )

    # Create revenue_forecasts table
    op.create_table(
        'revenue_forecasts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('artists.id', ondelete='CASCADE'), nullable=False),
        sa.Column('forecast_month', sa.Date(), nullable=False, index=True),
        sa.Column('scenario', forecast_scenario_enum, nullable=False),
        sa.Column('streaming_revenue', sa.Float(), nullable=False),
        sa.Column('concert_revenue', sa.Float(), server_default='0.0'),
        sa.Column('merch_revenue', sa.Float(), server_default='0.0'),
        sa.Column('sync_revenue', sa.Float(), server_default='0.0'),
        sa.Column('total_revenue', sa.Float(), nullable=False),
        sa.Column('confidence_score', sa.Float()),
        sa.Column('margin_of_error', sa.Float()),
        sa.Column('feature_data', postgresql.JSON()),
        sa.Column('calculated_at', sa.DateTime(), nullable=False),
        sa.Column('model_version', sa.String(), server_default='v1.0'),
    )

    # Create composite index for fast queries
    op.create_index(
        'ix_revenue_forecasts_artist_month_scenario',
        'revenue_forecasts',
        ['artist_id', 'forecast_month', 'scenario']
    )

    # Create revenue_actuals table
    op.create_table(
        'revenue_actuals',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('artists.id', ondelete='CASCADE'), nullable=False),
        sa.Column('revenue_month', sa.Date(), nullable=False, index=True),
        sa.Column('streaming_revenue', sa.Float(), nullable=False),
        sa.Column('concert_revenue', sa.Float(), server_default='0.0'),
        sa.Column('merch_revenue', sa.Float(), server_default='0.0'),
        sa.Column('sync_revenue', sa.Float(), server_default='0.0'),
        sa.Column('other_revenue', sa.Float(), server_default='0.0'),
        sa.Column('total_revenue', sa.Float(), nullable=False),
        sa.Column('total_streams', sa.Integer()),
        sa.Column('average_stream_rate', sa.Float()),
        sa.Column('notes', sa.String()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime()),
    )

    # Create unique index to prevent duplicate actuals
    op.create_index(
        'ix_revenue_actuals_artist_month',
        'revenue_actuals',
        ['artist_id', 'revenue_month'],
        unique=True
    )

    # Create forecast_accuracy table
    op.create_table(
        'forecast_accuracy',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('artists.id', ondelete='CASCADE'), nullable=False),
        sa.Column('forecast_month', sa.Date(), nullable=False, index=True),
        sa.Column('predicted_revenue', sa.Float(), nullable=False),
        sa.Column('actual_revenue', sa.Float(), nullable=False),
        sa.Column('accuracy_percentage', sa.Float()),
        sa.Column('error_percentage', sa.Float()),
        sa.Column('within_confidence_interval', sa.Integer(), server_default='0'),
        sa.Column('calculated_at', sa.DateTime(), nullable=False),
        sa.Column('model_version', sa.String()),
    )

    # Create index for accuracy tracking
    op.create_index(
        'ix_forecast_accuracy_artist_month',
        'forecast_accuracy',
        ['artist_id', 'forecast_month']
    )


def downgrade() -> None:
    # Drop tables
    op.drop_table('forecast_accuracy')
    op.drop_table('revenue_actuals')
    op.drop_table('revenue_forecasts')

    # Drop enum
    op.execute('DROP TYPE IF EXISTS forecastscenario CASCADE')
