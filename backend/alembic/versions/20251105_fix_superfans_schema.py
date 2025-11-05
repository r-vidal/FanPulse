"""Fix superfans table schema to match model

Revision ID: 010_fix_superfans_schema
Revises: 009_fix_apikey_enums
Create Date: 2025-11-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '010_fix_superfans_schema'
down_revision = '009_fix_apikey_enums'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop old columns that are no longer needed
    op.drop_column('superfans', 'email')
    op.drop_column('superfans', 'name')
    op.drop_column('superfans', 'lifetime_value')
    op.drop_column('superfans', 'last_interaction')
    op.drop_column('superfans', 'updated_at')

    # Add new columns to match the model
    op.add_column('superfans', sa.Column('platform_user_id', sa.String(), nullable=True))
    op.add_column('superfans', sa.Column('fvs_score', sa.Float(), nullable=True))
    op.add_column('superfans', sa.Column('listening_hours', sa.Float(), default=0.0))
    op.add_column('superfans', sa.Column('monetization_score', sa.Float(), default=0.0))
    op.add_column('superfans', sa.Column('contact_info', postgresql.JSONB()))
    op.add_column('superfans', sa.Column('last_updated', sa.DateTime()))

    # Update engagement_score to ensure it has the correct default
    op.alter_column('superfans', 'engagement_score',
                    existing_type=sa.Float(),
                    server_default='0.0',
                    nullable=True)

    # Make platform_user_id and fvs_score non-nullable after adding them
    # First set default values for existing rows
    op.execute("UPDATE superfans SET platform_user_id = '' WHERE platform_user_id IS NULL")
    op.execute("UPDATE superfans SET fvs_score = 0.0 WHERE fvs_score IS NULL")

    # Then make them non-nullable
    op.alter_column('superfans', 'platform_user_id', nullable=False)
    op.alter_column('superfans', 'fvs_score', nullable=False)

    # Create index on platform_user_id if not exists
    op.create_index('ix_superfans_platform_user_id', 'superfans', ['platform_user_id'], unique=False)


def downgrade() -> None:
    # Remove the new columns
    op.drop_index('ix_superfans_platform_user_id', 'superfans')
    op.drop_column('superfans', 'last_updated')
    op.drop_column('superfans', 'contact_info')
    op.drop_column('superfans', 'monetization_score')
    op.drop_column('superfans', 'listening_hours')
    op.drop_column('superfans', 'fvs_score')
    op.drop_column('superfans', 'platform_user_id')

    # Add back the old columns
    op.add_column('superfans', sa.Column('email', sa.String(), nullable=False))
    op.add_column('superfans', sa.Column('name', sa.String()))
    op.add_column('superfans', sa.Column('lifetime_value', sa.Float(), default=0.0))
    op.add_column('superfans', sa.Column('last_interaction', sa.DateTime()))
    op.add_column('superfans', sa.Column('updated_at', sa.DateTime()))
