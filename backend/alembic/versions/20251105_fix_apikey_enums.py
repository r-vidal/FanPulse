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
    # Fix API key enums by converting columns to use lowercase values
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_keys') THEN
                -- Step 1: Convert columns to text temporarily
                ALTER TABLE api_keys ALTER COLUMN status TYPE text USING status::text;
                ALTER TABLE api_keys ALTER COLUMN rate_limit_tier TYPE text USING rate_limit_tier::text;

                -- Step 2: Convert values to lowercase
                UPDATE api_keys SET status = lower(status);
                UPDATE api_keys SET rate_limit_tier = lower(rate_limit_tier);
            END IF;
        END $$;
    """)

    # Step 3: Drop the old enum types
    op.execute("DROP TYPE IF EXISTS apikeystatus CASCADE")
    op.execute("DROP TYPE IF EXISTS ratelimittier CASCADE")

    # Step 4: Create new enum types with lowercase values
    op.execute("CREATE TYPE apikeystatus AS ENUM ('active', 'revoked', 'expired')")
    op.execute("CREATE TYPE ratelimittier AS ENUM ('solo', 'pro', 'label', 'enterprise')")

    # Step 5: Convert columns back to enum types
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_keys') THEN
                ALTER TABLE api_keys
                    ALTER COLUMN status TYPE apikeystatus USING status::apikeystatus;

                ALTER TABLE api_keys
                    ALTER COLUMN rate_limit_tier TYPE ratelimittier USING rate_limit_tier::ratelimittier;

                -- Set defaults
                ALTER TABLE api_keys ALTER COLUMN status SET DEFAULT 'active';
                ALTER TABLE api_keys ALTER COLUMN rate_limit_tier SET DEFAULT 'solo';
            END IF;
        END $$;
    """)


def downgrade():
    # Revert to uppercase enum values (not recommended)
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_keys') THEN
                -- Convert columns to text
                ALTER TABLE api_keys ALTER COLUMN status TYPE text USING status::text;
                ALTER TABLE api_keys ALTER COLUMN rate_limit_tier TYPE text USING rate_limit_tier::text;

                -- Convert values to uppercase
                UPDATE api_keys SET status = upper(status);
                UPDATE api_keys SET rate_limit_tier = upper(rate_limit_tier);
            END IF;
        END $$;
    """)

    # Drop lowercase enums
    op.execute("DROP TYPE IF EXISTS apikeystatus CASCADE")
    op.execute("DROP TYPE IF EXISTS ratelimittier CASCADE")

    # Recreate with uppercase
    op.execute("CREATE TYPE apikeystatus AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED')")
    op.execute("CREATE TYPE ratelimittier AS ENUM ('SOLO', 'PRO', 'LABEL', 'ENTERPRISE')")

    # Convert back to enum
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_keys') THEN
                ALTER TABLE api_keys
                    ALTER COLUMN status TYPE apikeystatus USING status::apikeystatus;
                ALTER TABLE api_keys
                    ALTER COLUMN rate_limit_tier TYPE ratelimittier USING rate_limit_tier::ratelimittier;
            END IF;
        END $$;
    """)
