"""Add API keys and rate limiting system

Revision ID: 005_api_keys
Revises: 004_revenue_forecasting
Create Date: 2025-11-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '005_api_keys'
down_revision = '004_revenue_forecasting'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum for rate limit tiers
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE ratelimittier AS ENUM ('solo', 'pro', 'label', 'enterprise');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create enum for API key status
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE apikeystatus AS ENUM ('active', 'revoked', 'expired');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Reference the ENUM types
    rate_limit_tier_enum = postgresql.ENUM(
        'solo', 'pro', 'label', 'enterprise',
        name='ratelimittier',
        create_type=False
    )

    api_key_status_enum = postgresql.ENUM(
        'active', 'revoked', 'expired',
        name='apikeystatus',
        create_type=False
    )

    # Create api_keys table
    op.create_table(
        'api_keys',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),

        # Key identification
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String()),
        sa.Column('key_hash', sa.String(), nullable=False, unique=True, index=True),
        sa.Column('key_prefix', sa.String(8), nullable=False),

        # Rate limiting
        sa.Column('rate_limit_tier', rate_limit_tier_enum, nullable=False, server_default='solo'),
        sa.Column('requests_per_hour', sa.Integer(), nullable=False),

        # Usage tracking
        sa.Column('total_requests', sa.Integer(), server_default='0', nullable=False),
        sa.Column('last_used_at', sa.DateTime()),
        sa.Column('current_hour_requests', sa.Integer(), server_default='0', nullable=False),
        sa.Column('current_hour_start', sa.DateTime()),

        # Status and expiration
        sa.Column('status', api_key_status_enum, nullable=False, server_default='active'),
        sa.Column('expires_at', sa.DateTime()),

        # Permissions
        sa.Column('scopes', postgresql.JSON(), server_default='[]'),
        sa.Column('allowed_ips', postgresql.JSON(), server_default='[]'),

        # Metadata
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime()),
        sa.Column('revoked_at', sa.DateTime()),
        sa.Column('revoked_reason', sa.String()),
    )

    # Create index on user_id for fast user lookups
    op.create_index(
        'ix_api_keys_user_id',
        'api_keys',
        ['user_id']
    )

    # Create index on status for filtering
    op.create_index(
        'ix_api_keys_status',
        'api_keys',
        ['status']
    )

    # Create api_key_usage_logs table
    op.create_table(
        'api_key_usage_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('api_key_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('api_keys.id', ondelete='CASCADE'), nullable=False),

        # Request details
        sa.Column('endpoint', sa.String(), nullable=False),
        sa.Column('method', sa.String(10), nullable=False),
        sa.Column('status_code', sa.Integer(), nullable=False),

        # Performance metrics
        sa.Column('response_time_ms', sa.Integer()),

        # Request metadata
        sa.Column('ip_address', sa.String(45)),
        sa.Column('user_agent', sa.String()),

        # Cost tracking
        sa.Column('compute_units', sa.Integer(), server_default='1'),

        # Timestamp
        sa.Column('timestamp', sa.DateTime(), nullable=False, index=True),
    )

    # Create indexes for fast queries
    op.create_index(
        'ix_api_key_usage_logs_api_key_timestamp',
        'api_key_usage_logs',
        ['api_key_id', 'timestamp']
    )

    op.create_index(
        'ix_api_key_usage_logs_status_code',
        'api_key_usage_logs',
        ['status_code']
    )

    # Create api_key_usage_summaries table
    op.create_table(
        'api_key_usage_summaries',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('api_key_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('api_keys.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),

        # Summary date
        sa.Column('date', sa.DateTime(), nullable=False, index=True),

        # Request counts
        sa.Column('total_requests', sa.Integer(), server_default='0', nullable=False),
        sa.Column('successful_requests', sa.Integer(), server_default='0', nullable=False),
        sa.Column('failed_requests', sa.Integer(), server_default='0', nullable=False),
        sa.Column('rate_limited_requests', sa.Integer(), server_default='0', nullable=False),

        # Performance metrics
        sa.Column('avg_response_time_ms', sa.Integer()),
        sa.Column('p95_response_time_ms', sa.Integer()),

        # Top endpoints
        sa.Column('top_endpoints', postgresql.JSON(), server_default='[]'),

        # Compute units
        sa.Column('total_compute_units', sa.Integer(), server_default='0', nullable=False),

        # Timestamp
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )

    # Create composite index for fast user + date queries
    op.create_index(
        'ix_api_key_usage_summaries_user_date',
        'api_key_usage_summaries',
        ['user_id', 'date']
    )

    # Create unique constraint to prevent duplicate summaries
    op.create_index(
        'ix_api_key_usage_summaries_key_date',
        'api_key_usage_summaries',
        ['api_key_id', 'date'],
        unique=True
    )


def downgrade() -> None:
    # Drop tables
    op.drop_table('api_key_usage_summaries')
    op.drop_table('api_key_usage_logs')
    op.drop_table('api_keys')

    # Drop enums
    op.execute('DROP TYPE IF EXISTS apikeystatus CASCADE')
    op.execute('DROP TYPE IF EXISTS ratelimittier CASCADE')
