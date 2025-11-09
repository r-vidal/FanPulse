-- Fix duplicate enum types that may cause migration failures
-- This script is idempotent and can be run multiple times safely

DO $$
BEGIN
    -- Only proceed if poststatus enum exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'poststatus') THEN
        -- Check if any tables are using this enum
        -- If not, we can safely drop it
        IF NOT EXISTS (
            SELECT 1
            FROM pg_attribute a
            JOIN pg_class c ON a.attrelid = c.oid
            JOIN pg_type t ON a.atttypid = t.oid
            WHERE t.typname = 'poststatus'
        ) THEN
            -- No tables use it, safe to drop
            EXECUTE 'DROP TYPE IF EXISTS poststatus CASCADE';
            RAISE NOTICE 'Dropped unused poststatus enum type';
        ELSE
            -- Tables are using it, just log and continue
            RAISE NOTICE 'poststatus enum exists and is in use - skipping cleanup';
        END IF;
    END IF;
END $$;
