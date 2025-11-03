"""Fix alerts table schema

Revision ID: 001a_fix_alerts
Revises: 001_platform_models
Create Date: 2025-11-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001a_fix_alerts'
down_revision = '001_platform_models'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum for alert types using SQL to handle "already exists" gracefully
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE alerttype AS ENUM ('viral', 'engagement_drop', 'opportunity', 'threat');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create enum for alert severity using SQL to handle "already exists" gracefully
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE alertseverity AS ENUM ('urgent', 'warning', 'info');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Reference the ENUM types (don't try to create them)
    alert_type_enum = postgresql.ENUM(
        'viral', 'engagement_drop', 'opportunity', 'threat',
        name='alerttype',
        create_type=False
    )

    alert_severity_enum = postgresql.ENUM(
        'urgent', 'warning', 'info',
        name='alertseverity',
        create_type=False
    )

    # Drop the existing alerts table completely and recreate it with the correct schema
    op.drop_table('alerts')

    # Create alerts table with correct schema
    op.create_table(
        'alerts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('artists.id'), nullable=False),
        sa.Column('alert_type', alert_type_enum, nullable=False),
        sa.Column('severity', alert_severity_enum, nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('data', postgresql.JSONB()),
        sa.Column('created_at', sa.DateTime(), nullable=False, index=True),
        sa.Column('resolved_at', sa.DateTime()),
    )

    # Create indexes
    op.create_index('ix_alerts_user_id', 'alerts', ['user_id'])
    op.create_index('ix_alerts_artist_id', 'alerts', ['artist_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_alerts_artist_id', 'alerts')
    op.drop_index('ix_alerts_user_id', 'alerts')

    # Drop alerts table
    op.drop_table('alerts')

    # Drop enum types
    alert_type_enum = postgresql.ENUM(name='alerttype')
    alert_type_enum.drop(op.get_bind(), checkfirst=True)

    alert_severity_enum = postgresql.ENUM(name='alertseverity')
    alert_severity_enum.drop(op.get_bind(), checkfirst=True)

    # Recreate old alerts table
    op.create_table(
        'alerts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('artists.id'), nullable=False),
        sa.Column('alert_type', sa.String(), nullable=False),
        sa.Column('threshold', sa.Float()),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime()),
    )
