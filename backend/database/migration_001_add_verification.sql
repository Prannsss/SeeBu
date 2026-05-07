-- ============================================================
-- Migration 001: Add Verification System
-- Run this once in the Supabase SQL Editor.
-- All statements are idempotent (safe to re-run).
-- ============================================================

-- 1. Ensure uuid-ossp extension exists (required for uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Add email_verified column to all user tables (safe if already present)
ALTER TABLE clients          ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE admins           ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE superadmins      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE workforce_admins ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE workforce_officers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- 3. Create verification_tokens table (the core missing piece)
--    Stores 6-digit OTPs for both email verification and password resets.
--    The UNIQUE constraint on (email, type) allows upsert by conflict.
CREATE TABLE IF NOT EXISTS verification_tokens (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email      VARCHAR(255) NOT NULL,
    code       VARCHAR(10)  NOT NULL,
    type       VARCHAR(30)  NOT NULL DEFAULT 'email_verify',
    -- Supported types: 'email_verify', 'password_reset'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT verification_tokens_email_type_unique UNIQUE (email, type)
);

-- 4. Index for fast lookups by email + type
CREATE INDEX IF NOT EXISTS idx_verification_tokens_email_type
    ON verification_tokens (email, type);

-- Done. The following tables now support the verification flow:
--   verification_tokens   — stores OTPs
--   clients               — email_verified column
--   admins                — email_verified column
--   superadmins           — email_verified column
--   workforce_admins      — email_verified column
--   workforce_officers    — email_verified column
