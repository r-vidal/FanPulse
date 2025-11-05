"""fix apikey enum values to lowercase

Revision ID: 009_fix_apikey_enums
Revises: 008_next_best_actions
Create Date: 2025-11-05 18:40:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '009_fix_apikey_enums'
down_revision = '008_next_best_actions'
branch_labels = None
depends_on = None


def upgrade():
    # Drop and recreate the enums with correct lowercase values
    # First, we need to update any existing data to lowercase

    # Update existing status values to lowercase if table exists
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_keys') THEN
                -- Update status column if it exists
                UPDATE api_keys SET status = lower(status::text)::text WHERE status IS NOT NULL;
                -- Update rate_limit_tier column if it exists
                UPDATE api_keys SET rate_limit_tier = lower(rate_limit_tier::text)::text WHERE rate_limit_tier IS NOT NULL;
            END IF;
        END $$;
    """)

    # Drop the old enum types if they exist
    op.execute("DROP TYPE IF EXISTS apikeystatus CASCADE")
    op.execute("DROP TYPE IF EXISTS ratelimittier CASCADE")

    # Create new enum types with lowercase values
    op.execute("CREATE TYPE apikeystatus AS ENUM ('active', 'revoked', 'expired')")
    op.execute("CREATE TYPE ratelimittier AS ENUM ('solo', 'pro', 'label', 'enterprise')")

    # If api_keys table exists, add back the columns with proper enum types
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_keys') THEN
                -- Re-add status column with new enum type
                ALTER TABLE api_keys
                    ALTER COLUMN status TYPE apikeystatus USING status::text::apikeystatus;

                -- Re-add rate_limit_tier column with new enum type
                ALTER TABLE api_keys
                    ALTER COLUMN rate_limit_tier TYPE ratelimittier USING rate_limit_tier::text::ratelimittier;
            END IF;
        END $$;
    """)


def downgrade():
    # Revert to uppercase enum values (not recommended, but for completeness)
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_keys') THEN
                UPDATE api_keys SET status = upper(status::text)::text WHERE status IS NOT NULL;
                UPDATE api_keys SET rate_limit_tier = upper(rate_limit_tier::text)::text WHERE rate_limit_tier IS NOT NULL;
            END IF;
        END $$;
    """)

    op.execute("DROP TYPE IF EXISTS apikeystatus CASCADE")
    op.execute("DROP TYPE IF EXISTS ratelimittier CASCADE")

    # Recreate with uppercase (old incorrect values)
    op.execute("CREATE TYPE apikeystatus AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED')")
    op.execute("CREATE TYPE ratelimittier AS ENUM ('SOLO', 'PRO', 'LABEL', 'ENTERPRISE')")

    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_keys') THEN
                ALTER TABLE api_keys
                    ALTER COLUMN status TYPE apikeystatus USING status::text::apikeystatus;
                ALTER TABLE api_keys
                    ALTER COLUMN rate_limit_tier TYPE ratelimittier USING rate_limit_tier::text::ratelimittier;
            END IF;
        END $$;
    """)
