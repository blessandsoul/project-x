-- Migration: Add multi-language description support
-- Date: 2024-12-25
-- Description: Replace single description field with three language-specific fields

-- Note: This will DROP existing description data. 
-- This is acceptable in development environment.

ALTER TABLE companies 
  DROP COLUMN description,
  ADD COLUMN description_geo TEXT NULL COMMENT 'Company description in Georgian',
  ADD COLUMN description_eng TEXT NULL COMMENT 'Company description in English',
  ADD COLUMN description_rus TEXT NULL COMMENT 'Company description in Russian';

-- Verify the changes
DESCRIBE companies;
