-- Migration: Create vehicle_makes and vehicle_models tables
-- Description: Creates tables for vehicle make/model data with type filtering support

-- ============================================================================
-- Table: vehicle_models (source of truth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicle_models (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  make_id INT NOT NULL,
  make_name VARCHAR(100) NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  vehicle_types VARCHAR(50) NOT NULL COMMENT 'e.g. car, multipurpose, truck, motorcycle, or comma-separated combos',
  first_year INT NULL,
  last_year INT NULL,
  UNIQUE KEY uniq_make_model (make_id, model_name),
  KEY idx_make_id (make_id),
  KEY idx_vehicle_types (vehicle_types),
  KEY idx_years (first_year, last_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Table: vehicle_makes (derived lookup table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicle_makes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  make_id INT NOT NULL COMMENT 'Same make_id as in vehicle_models',
  make_name VARCHAR(150) NOT NULL,
  has_car TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 if make has car/multipurpose/truck models',
  has_motorcycle TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 if make has motorcycle models',
  UNIQUE KEY uq_make_id (make_id),
  KEY idx_make_name (make_name),
  KEY idx_has_car (has_car),
  KEY idx_has_motorcycle (has_motorcycle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Populate vehicle_makes from vehicle_models
-- ============================================================================
-- This query builds the derived lookup table from the source of truth.
-- Run this after populating vehicle_models with your data.
--
-- Semantic rules:
-- - has_car = 1 when vehicle_types contains 'car', 'multipurpose', or 'truck'
-- - has_motorcycle = 1 when vehicle_types contains 'motorcycle'
-- - A make can have both flags set to 1 if it has both types of models
--
-- Example usage:
-- INSERT INTO vehicle_makes (make_id, make_name, has_car, has_motorcycle)
-- SELECT
--   vm.make_id,
--   vm.make_name,
--   MAX(
--     CASE
--       WHEN vm.vehicle_types LIKE '%car%'
--         OR vm.vehicle_types LIKE '%multipurpose%'
--         OR vm.vehicle_types LIKE '%truck%'
--       THEN 1 ELSE 0
--     END
--   ) AS has_car,
--   MAX(
--     CASE
--       WHEN FIND_IN_SET('motorcycle', vm.vehicle_types) > 0
--       THEN 1 ELSE 0
--     END
--   ) AS has_motorcycle
-- FROM vehicle_models vm
-- GROUP BY vm.make_id, vm.make_name
-- ON DUPLICATE KEY UPDATE
--   make_name = VALUES(make_name),
--   has_car = VALUES(has_car),
--   has_motorcycle = VALUES(has_motorcycle);
