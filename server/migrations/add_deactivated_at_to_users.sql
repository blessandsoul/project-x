-- Migration: Add deactivated_at column to users table
-- Purpose: Support soft-delete account deactivation
-- Date: 2024-12-14

-- Add deactivated_at column (nullable timestamp for soft delete)
ALTER TABLE users
ADD COLUMN deactivated_at TIMESTAMP NULL DEFAULT NULL
AFTER is_blocked;

-- Add index for efficient filtering of active users
CREATE INDEX idx_users_deactivated_at ON users(deactivated_at);

-- Note: Deactivated users cannot login or refresh tokens.
-- To reactivate, set deactivated_at = NULL.
