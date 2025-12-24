-- Migration: Add canonical columns to vehicles table
-- Description: Adds canonical_brand, canonical_model_key for deterministic search

-- Add canonical columns to vehicles table
ALTER TABLE vehicles
  ADD COLUMN canonical_brand VARCHAR(100) DEFAULT NULL AFTER model_name,
  ADD COLUMN canonical_model_key VARCHAR(100) DEFAULT NULL AFTER canonical_brand;

-- Add index for fast lookups on canonical_model_key
CREATE INDEX idx_vehicles_canonical_model_key ON vehicles (canonical_model_key);
CREATE INDEX idx_vehicles_canonical_brand ON vehicles (canonical_brand);

-- Compound index for brand + model searches
CREATE INDEX idx_vehicles_canonical_brand_model ON vehicles (canonical_brand, canonical_model_key);
