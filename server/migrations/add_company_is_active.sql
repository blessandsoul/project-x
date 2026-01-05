-- Migration: Add is_active column to companies table
-- Purpose: Support hiding companies when owner deactivates account
-- Date: 2024-12-24

-- Add is_active column for soft visibility toggle
-- Default is TRUE (1) so all existing companies remain active
ALTER TABLE companies
ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER owner_user_id;

-- Index for filtering active companies in queries
CREATE INDEX idx_companies_is_active ON companies(is_active);

-- Note:
-- - is_active = 1: Company is visible in public listings
-- - is_active = 0: Company is hidden (owner deactivated account)
-- - When company owner deactivates: Set is_active = 0
-- - When company owner reactivates: Set is_active = 1
-- - All existing companies are active by default (migration sets DEFAULT 1)
