-- =============================================================================
-- Migration: Create Services Master Table
-- =============================================================================
-- Creates a master table for logistics services that companies can offer.
-- Replaces hardcoded frontend list with database-driven values.
-- 
-- Run: mysql -u <user> -p <database> < migrations/create_services.sql
-- =============================================================================

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_services_name (name),
  KEY idx_services_active_sort (is_active, sort_order, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed initial services (exact names from current UI, case-sensitive)
INSERT INTO services (name, sort_order) VALUES
  ('Ocean Freight', 1),
  ('Inland Trucking', 2),
  ('Customs Clearance', 3),
  ('Insurance', 4),
  ('Parts Shipping', 5)
ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order);
