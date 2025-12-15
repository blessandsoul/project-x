-- Migration: Remove Lead Feature Tables
-- Date: 2024-12-14
-- Description: Drops all lead-related tables as part of the lead feature removal
-- WARNING: This is a destructive migration. Ensure you have backups before running.

-- Disable foreign key checks to allow dropping tables with dependencies
SET FOREIGN_KEY_CHECKS = 0;

-- Drop lead_offers table (child of lead_companies)
DROP TABLE IF EXISTS lead_offers;

-- Drop lead_companies table (child of leads)
DROP TABLE IF EXISTS lead_companies;

-- Drop leads table (parent)
DROP TABLE IF EXISTS leads;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Optional: Remove receives_general_leads column from companies table if it exists
-- ALTER TABLE companies DROP COLUMN IF EXISTS receives_general_leads;
