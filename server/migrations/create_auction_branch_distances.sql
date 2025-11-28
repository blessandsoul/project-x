-- Migration: Create auction_branch_distances table
-- Purpose: Cache geocoded auction branch locations and their distances to Poti, Georgia
-- This avoids repeated API calls to the geolocation service

CREATE TABLE IF NOT EXISTS auction_branch_distances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  address VARCHAR(500) NOT NULL,
  source ENUM('copart', 'iaai') NOT NULL,
  lat DECIMAL(10, 7) NULL,
  lon DECIMAL(10, 7) NULL,
  distance_to_poti_miles INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Unique constraint on address + source to prevent duplicates
  UNIQUE KEY uk_address_source (address(255), source),
  
  -- Index for fast lookups
  INDEX idx_source (source),
  INDEX idx_distance (distance_to_poti_miles)
);
