-- Migration: Add created_at to users table
-- Generated: 2026-04-21 (ARCH-11 fix)
-- Apply with: psql -d <your_db> -f this_file.sql
-- OR run individually in your PostgreSQL client.

-- Step 1: Add the column (nullable first to avoid locking issues on existing rows)
ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Step 2: Create an index to make admin sort-by-created_at fast
CREATE INDEX IF NOT EXISTS ix_user_created_at ON "user" (created_at DESC);

-- Verification (run after applying):
-- SELECT id, email, created_at FROM "user" ORDER BY created_at DESC LIMIT 5;
