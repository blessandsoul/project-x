-- =============================================================================
-- Rollback: Remove Calculator Adapter Configuration from Companies
-- =============================================================================
-- Use this to undo the add_calculator_config.sql migration.
-- WARNING: This will delete all calculator configuration data!
-- =============================================================================

-- Drop index first
DROP INDEX idx_companies_calculator_type ON companies;

-- Drop columns
ALTER TABLE companies
  DROP COLUMN calculator_config,
  DROP COLUMN calculator_api_url,
  DROP COLUMN calculator_type;
