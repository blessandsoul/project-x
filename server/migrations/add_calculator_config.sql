-- =============================================================================
-- Migration: Add Calculator Adapter Configuration to Companies
-- =============================================================================
-- Adds support for per-company calculator APIs using the Adapter Pattern.
-- All existing companies default to 'default' (Auto Market Logistic).
-- =============================================================================

-- Add calculator configuration columns to companies table
ALTER TABLE companies
  ADD COLUMN calculator_type ENUM('default', 'custom_api', 'formula') 
    NOT NULL DEFAULT 'default' AFTER final_formula,
  ADD COLUMN calculator_api_url VARCHAR(500) NULL AFTER calculator_type,
  ADD COLUMN calculator_config JSON NULL AFTER calculator_api_url;

-- Create index for filtering by calculator type
CREATE INDEX idx_companies_calculator_type ON companies(calculator_type);

-- =============================================================================
-- Verification Query (run after migration)
-- =============================================================================
-- SELECT 
--   COLUMN_NAME, 
--   COLUMN_TYPE, 
--   IS_NULLABLE, 
--   COLUMN_DEFAULT
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = DATABASE() 
--   AND TABLE_NAME = 'companies'
--   AND COLUMN_NAME IN ('calculator_type', 'calculator_api_url', 'calculator_config');
