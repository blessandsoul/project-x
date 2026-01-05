-- =============================================================================
-- Migration: Option B - 2-Step Onboarding Schema
-- =============================================================================
-- This migration implements the 2-step registration/onboarding flow:
-- 1. User registers (role=user, no company)
-- 2. User creates company via POST /companies/onboard (role becomes company)
--
-- IMPORTANT: This migration WIPES existing data. Run only in development.
-- =============================================================================

-- Disable foreign key checks for clean rebuild
-- NOTE: If running in phpMyAdmin, run the ENTIRE script at once, not line-by-line
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- Drop foreign key constraints first (in case FK_CHECKS=0 doesn't work)
-- =============================================================================
-- Drop FKs from users table
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
                  WHERE CONSTRAINT_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'users' 
                  AND CONSTRAINT_NAME = 'fk_users_company_id');
SET @sql = IF(@fk_exists > 0, 'ALTER TABLE users DROP FOREIGN KEY fk_users_company_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop FKs from companies table
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
                  WHERE CONSTRAINT_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'companies' 
                  AND CONSTRAINT_NAME = 'fk_companies_owner_user_id');
SET @sql = IF(@fk_exists > 0, 'ALTER TABLE companies DROP FOREIGN KEY fk_companies_owner_user_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =============================================================================
-- Drop existing tables (safe now that FKs are removed)
-- =============================================================================
DROP TABLE IF EXISTS company_quotes;
DROP TABLE IF EXISTS company_social_links;
DROP TABLE IF EXISTS company_reviews;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS companies;

-- =============================================================================
-- Create companies table with owner_user_id
-- =============================================================================
CREATE TABLE companies (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  
  -- Ownership: which user owns this company (1:1 relationship)
  -- NOT NULL enforced after users table exists via ALTER TABLE
  -- UNIQUE constraint prevents race conditions (double onboard)
  owner_user_id INT UNSIGNED NULL,
  
  -- Core fields
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  
  -- Pricing fields (DECIMAL for precision)
  base_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  price_per_mile DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
  customs_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  service_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  broker_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  insurance DECIMAL(12, 2) NULL,
  
  -- Computed score for sorting by cheapest
  cheapest_score DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  
  -- Additional fields
  final_formula JSON NULL,
  description TEXT NULL,
  country VARCHAR(100) NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
  is_vip TINYINT(1) NOT NULL DEFAULT 0,
  subscription_free TINYINT(1) NOT NULL DEFAULT 1,
  subscription_ends_at DATETIME NULL,
  services JSON NULL,
  phone_number VARCHAR(50) NULL,
  contact_email VARCHAR(255) NULL,
  website VARCHAR(500) NULL,
  established_year SMALLINT UNSIGNED NULL,
  receives_general_leads TINYINT(1) NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  UNIQUE KEY uk_companies_slug (slug),
  UNIQUE KEY uk_companies_owner_user_id (owner_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Create users table
-- =============================================================================
CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  
  -- Core fields
  email VARCHAR(255) NOT NULL,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Role: user (default), company (after onboarding), admin
  role ENUM('user', 'dealer', 'company', 'admin') NOT NULL DEFAULT 'user',
  
  -- Company link (set after onboarding)
  company_id INT UNSIGNED NULL,
  
  -- Legacy dealer support
  dealer_slug VARCHAR(255) NULL,
  
  -- Onboarding/subscription
  onboarding_ends_at DATETIME NULL,
  
  -- Account status
  is_blocked TINYINT(1) NOT NULL DEFAULT 0,
  deactivated_at DATETIME NULL,
  
  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  UNIQUE KEY uk_users_username (username),
  KEY idx_users_company_id (company_id),
  KEY idx_users_role (role),
  
  -- FK to companies (nullable - set after onboarding)
  CONSTRAINT fk_users_company_id 
    FOREIGN KEY (company_id) REFERENCES companies(id) 
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Add FK from companies.owner_user_id to users.id
-- (Must be added after users table exists)
-- =============================================================================
ALTER TABLE companies
  ADD CONSTRAINT fk_companies_owner_user_id
    FOREIGN KEY (owner_user_id) REFERENCES users(id)
    ON DELETE RESTRICT;

-- Make owner_user_id NOT NULL now that FK is in place
-- This ensures every company MUST have an owner
ALTER TABLE companies
  MODIFY owner_user_id INT UNSIGNED NOT NULL;

-- =============================================================================
-- Create user_sessions table (for HttpOnly cookie auth)
-- =============================================================================
CREATE TABLE user_sessions (
  id CHAR(36) NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  refresh_hash CHAR(64) NOT NULL,
  user_agent VARCHAR(512) NULL,
  ip VARCHAR(45) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  replaced_by CHAR(36) NULL,
  
  PRIMARY KEY (id),
  KEY idx_user_sessions_user_id (user_id),
  KEY idx_user_sessions_refresh_hash (refresh_hash),
  KEY idx_user_sessions_expires_at (expires_at),
  KEY idx_user_sessions_revoked_at (revoked_at),
  
  CONSTRAINT fk_user_sessions_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) 
    ON DELETE CASCADE,
  CONSTRAINT fk_user_sessions_replaced_by 
    FOREIGN KEY (replaced_by) REFERENCES user_sessions(id) 
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Create company_social_links table
-- =============================================================================
CREATE TABLE company_social_links (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id INT UNSIGNED NOT NULL,
  url VARCHAR(500) NOT NULL,
  
  PRIMARY KEY (id),
  KEY idx_company_social_links_company_id (company_id),
  
  CONSTRAINT fk_company_social_links_company_id 
    FOREIGN KEY (company_id) REFERENCES companies(id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Create company_quotes table
-- =============================================================================
CREATE TABLE company_quotes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id INT UNSIGNED NOT NULL,
  vehicle_id INT UNSIGNED NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  breakdown JSON NULL,
  delivery_time_days SMALLINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  KEY idx_company_quotes_company_id (company_id),
  KEY idx_company_quotes_vehicle_id (vehicle_id),
  
  CONSTRAINT fk_company_quotes_company_id 
    FOREIGN KEY (company_id) REFERENCES companies(id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Create company_reviews table
-- =============================================================================
CREATE TABLE company_reviews (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  rating DECIMAL(2, 1) NOT NULL,
  comment TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  KEY idx_company_reviews_company_id (company_id),
  KEY idx_company_reviews_user_id (user_id),
  UNIQUE KEY uk_company_reviews_user_company (user_id, company_id),
  
  CONSTRAINT fk_company_reviews_company_id 
    FOREIGN KEY (company_id) REFERENCES companies(id) 
    ON DELETE CASCADE,
  CONSTRAINT fk_company_reviews_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Summary of constraints:
-- =============================================================================
-- 1. companies.owner_user_id:
--    - NOT NULL (every company must have an owner)
--    - UNIQUE (prevents race conditions - one company per user)
--    - FK to users.id ON DELETE RESTRICT (cannot delete user who owns company)
--
-- 2. users.company_id:
--    - NULLABLE (set after onboarding)
--    - FK to companies.id ON DELETE SET NULL
--    - INDEX for fast lookups
--
-- 3. Integrity guarantees:
--    - UNIQUE(owner_user_id) prevents double onboard via race condition
--    - ON DELETE RESTRICT prevents orphaned companies
--    - Bidirectional FKs for clean authorization checks
--
-- 4. DECIMAL types for pricing fields (better precision than FLOAT)
-- 5. All existing data wiped for clean schema
-- =============================================================================
