-- =============================================================================
-- Migration: Add Structured Social Links (link_type, platform)
-- =============================================================================
-- Implements: 1 Website + 2 Social Links (Facebook/Instagram only)
-- =============================================================================

-- Step 1: Add new columns to company_social_links
ALTER TABLE company_social_links
  ADD COLUMN link_type ENUM('website', 'social') NOT NULL DEFAULT 'social' AFTER company_id,
  ADD COLUMN platform ENUM('facebook', 'instagram') NULL COMMENT 'Required for social links' AFTER link_type,
  ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER url,
  ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Step 2: Migrate existing data
-- Mark the first link per company as website, rest as social (best guess)
-- First, find the minimum ID per company and mark it as website
UPDATE company_social_links csl
SET link_type = 'website'
WHERE csl.id = (
  SELECT min_id FROM (
    SELECT MIN(id) as min_id, company_id 
    FROM company_social_links 
    GROUP BY company_id
  ) AS first_links 
  WHERE first_links.company_id = csl.company_id
);

-- Step 3: Try to auto-detect platform from URL for social links
-- Facebook
UPDATE company_social_links
SET platform = 'facebook'
WHERE link_type = 'social' 
  AND platform IS NULL
  AND (url LIKE '%facebook.com%' OR url LIKE '%fb.com%');

-- Instagram
UPDATE company_social_links
SET platform = 'instagram'
WHERE link_type = 'social' 
  AND platform IS NULL
  AND (url LIKE '%instagram.com%');

-- Step 4: For remaining social links without platform, set to facebook as fallback
UPDATE company_social_links
SET platform = 'facebook'
WHERE link_type = 'social' AND platform IS NULL;

-- Step 5: Add unique constraint for website (only 1 per company)
-- First check if any company has multiple entries that would violate this
-- SELECT company_id, link_type, COUNT(*) 
-- FROM company_social_links 
-- WHERE link_type = 'website' 
-- GROUP BY company_id, link_type 
-- HAVING COUNT(*) > 1;

-- Create a partial unique index for website only
-- MySQL doesn't support partial unique indexes directly, so we use a workaround
-- The application layer will enforce: 1 website, max 2 social links

-- Step 6: Add index for querying by link_type
ALTER TABLE company_social_links
  ADD INDEX idx_company_social_links_type (company_id, link_type);

-- =============================================================================
-- Verification Query (run after migration to check data)
-- =============================================================================
-- SELECT 
--   company_id,
--   SUM(CASE WHEN link_type = 'website' THEN 1 ELSE 0 END) as website_count,
--   SUM(CASE WHEN link_type = 'social' THEN 1 ELSE 0 END) as social_count
-- FROM company_social_links
-- GROUP BY company_id;

-- =============================================================================
-- Cleanup: Delete excess social links (keep only 2 per company)
-- Run this only if needed after reviewing the data
-- =============================================================================
-- DELETE FROM company_social_links
-- WHERE link_type = 'social'
--   AND id NOT IN (
--     SELECT id FROM (
--       SELECT id, company_id, 
--              ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY id) as rn
--       FROM company_social_links 
--       WHERE link_type = 'social'
--     ) ranked
--     WHERE rn <= 2
--   );
