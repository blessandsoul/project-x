-- Migration: Add deletion lifecycle columns to users table
-- Purpose: Support 30-day grace period for account deletion
-- Date: 2024-12-24

-- Add deletion_scheduled_at column (when permanent deletion is scheduled)
ALTER TABLE users
ADD COLUMN deletion_scheduled_at DATETIME NULL DEFAULT NULL AFTER deactivated_at;

-- Add deletion_completed_at column (when permanent deletion was completed)
ALTER TABLE users
ADD COLUMN deletion_completed_at DATETIME NULL DEFAULT NULL AFTER deletion_scheduled_at;

-- Index for cleanup job queries (find accounts pending permanent deletion)
CREATE INDEX idx_users_deletion_scheduled ON users(deletion_scheduled_at);

-- Backfill existing deactivated accounts to set deletion_scheduled_at
-- This sets deletion to 30 days from when they were deactivated
UPDATE users 
SET deletion_scheduled_at = DATE_ADD(deactivated_at, INTERVAL 30 DAY)
WHERE deactivated_at IS NOT NULL 
  AND deletion_scheduled_at IS NULL
  AND deletion_completed_at IS NULL;

-- Note: 
-- - deletion_scheduled_at: Set when user deactivates (NOW + 30 days)
-- - deletion_completed_at: Set when cleanup job anonymizes the account
-- - To reactivate: Set both deactivated_at and deletion_scheduled_at to NULL
