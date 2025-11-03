"""Add alerts and notifications

Revision ID: 002_alerts_notifications
Revises: 001a_fix_alerts
Create Date: 2025-11-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_alerts_notifications'
down_revision = '001a_fix_alerts'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum for alert rule types using SQL to handle "already exists" gracefully
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE alertruletype AS ENUM ('momentum_spike', 'momentum_drop', 'fvs_threshold', 'follower_milestone',
                'viral_post', 'engagement_drop', 'superfan_churn', 'growth_stall');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Reference the ENUM type (don't try to create it)
    alert_rule_type_enum = postgresql.ENUM(
        'momentum_spike', 'momentum_drop', 'fvs_threshold', 'follower_milestone',
        'viral_post', 'engagement_drop', 'superfan_churn', 'growth_stall',
        name='alertruletype',
        create_type=False
    )

    # Create alert_rules table
    op.create_table(
        'alert_rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('artists.id'), nullable=False),
        sa.Column('rule_type', alert_rule_type_enum, nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('threshold_value', sa.Float()),
        sa.Column('comparison_operator', sa.String()),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
        sa.Column('notify_email', sa.Boolean(), default=True, nullable=False),
        sa.Column('notify_in_app', sa.Boolean(), default=True, nullable=False),
        sa.Column('cooldown_hours', sa.Integer(), default=24),
        sa.Column('last_triggered_at', sa.DateTime()),
        sa.Column('config', postgresql.JSONB()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime()),
    )

    # Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('alert_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('alerts.id')),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('type', sa.String()),
        sa.Column('channel', sa.String()),
        sa.Column('is_read', sa.Boolean(), default=False, nullable=False),
        sa.Column('read_at', sa.DateTime()),
        sa.Column('data', postgresql.JSONB()),
        sa.Column('created_at', sa.DateTime(), nullable=False, index=True),
    )

    # Create indexes
    op.create_index('ix_alert_rules_user_artist', 'alert_rules', ['user_id', 'artist_id'])
    op.create_index('ix_notifications_user_unread', 'notifications', ['user_id', 'is_read'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_notifications_user_unread', 'notifications')
    op.drop_index('ix_alert_rules_user_artist', 'alert_rules')

    # Drop tables
    op.drop_table('notifications')
    op.drop_table('alert_rules')

    # Drop enum type
    alert_rule_type_enum = postgresql.ENUM(name='alertruletype')
    alert_rule_type_enum.drop(op.get_bind(), checkfirst=True)
