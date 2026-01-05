-- =============================================================================
-- Migration: Option B - Add owner_user_id to companies (NON-DESTRUCTIVE)
-- =============================================================================
-- This migration adds the owner_user_id column to companies table for
-- 2-step onboarding WITHOUT dropping any existing data.
--
-- Safe to run on existing database with data.
-- =============================================================================

-- =============================================================================
-- Step 1: Add owner_user_id column to companies (nullable initially)
-- =============================================================================
-- Check if column already exists before adding
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'companies' 
                   AND COLUMN_NAME = 'owner_user_id');

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE companies ADD COLUMN owner_user_id INT UNSIGNED NULL AFTER id',
  'SELECT "owner_user_id column already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =============================================================================
-- Step 2: Add UNIQUE constraint on owner_user_id (prevents double onboard)
-- =============================================================================
-- Check if unique key already exists
SET @uk_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
                  WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'companies' 
                  AND INDEX_NAME = 'uk_companies_owner_user_id');

SET @sql = IF(@uk_exists = 0, 
  'ALTER TABLE companies ADD UNIQUE KEY uk_companies_owner_user_id (owner_user_id)',
  'SELECT "uk_companies_owner_user_id already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =============================================================================
-- Step 3: Add FK from companies.owner_user_id to users.id
-- =============================================================================
-- Check if FK already exists
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
                  WHERE CONSTRAINT_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'companies' 
                  AND CONSTRAINT_NAME = 'fk_companies_owner_user_id');

SET @sql = IF(@fk_exists = 0, 
  'ALTER TABLE companies ADD CONSTRAINT fk_companies_owner_user_id FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE RESTRICT',
  'SELECT "fk_companies_owner_user_id already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =============================================================================
-- Step 4: Add index on users.company_id if not exists
-- =============================================================================
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'users' 
                   AND INDEX_NAME = 'idx_users_company_id');

SET @sql = IF(@idx_exists = 0, 
  'ALTER TABLE users ADD INDEX idx_users_company_id (company_id)',
  'SELECT "idx_users_company_id already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =============================================================================
-- Step 5: Add FK from users.company_id to companies.id if not exists
-- =============================================================================
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
                  WHERE CONSTRAINT_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'users' 
                  AND CONSTRAINT_NAME = 'fk_users_company_id');

SET @sql = IF(@fk_exists = 0, 
  'ALTER TABLE users ADD CONSTRAINT fk_users_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL',
  'SELECT "fk_users_company_id already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =============================================================================
-- Step 6: Add index on users.role if not exists
-- =============================================================================
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'users' 
                   AND INDEX_NAME = 'idx_users_role');

SET @sql = IF(@idx_exists = 0, 
  'ALTER TABLE users ADD INDEX idx_users_role (role)',
  'SELECT "idx_users_role already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =============================================================================
-- IMPORTANT: owner_user_id is NULLABLE for now
-- =============================================================================
-- Existing companies won't have an owner_user_id set.
-- You have two options:
--
-- Option A: Keep it nullable (recommended for existing data)
--   - New companies created via /companies/onboard will have owner_user_id set
--   - Existing companies remain with owner_user_id = NULL
--   - Authorization checks handle NULL gracefully
--
-- Option B: Manually assign owners to existing companies, then make NOT NULL
--   - Run: UPDATE companies SET owner_user_id = <user_id> WHERE id = <company_id>;
--   - After all companies have owners:
--     ALTER TABLE companies MODIFY owner_user_id INT UNSIGNED NOT NULL;
--
-- =============================================================================

-- Verify the changes
SELECT 'Migration complete. Verifying schema...' AS status;

SELECT 
  COLUMN_NAME, 
  IS_NULLABLE, 
  DATA_TYPE 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'companies' 
  AND COLUMN_NAME = 'owner_user_id';

SELECT 
  CONSTRAINT_NAME, 
  TABLE_NAME 
FROM information_schema.TABLE_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = DATABASE() 
  AND (CONSTRAINT_NAME LIKE '%owner_user_id%' OR CONSTRAINT_NAME LIKE '%company_id%');
