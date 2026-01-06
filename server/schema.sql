-- =============================================================================
-- Complete Database Schema for Project-X
-- Generated: 2026-01-06
-- =============================================================================

USE `default`;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- Core Tables: Companies & Users
-- =============================================================================

CREATE TABLE IF NOT EXISTS companies (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  base_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  price_per_mile DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
  customs_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  service_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  broker_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  insurance DECIMAL(12, 2) NULL,
  cheapest_score DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  final_formula JSON NULL,
  description TEXT NULL,
  description_en TEXT NULL,
  description_ka TEXT NULL,
  description_ru TEXT NULL,
  country VARCHAR(100) NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
  is_vip TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  subscription_free TINYINT(1) NOT NULL DEFAULT 1,
  subscription_ends_at DATETIME NULL,
  services JSON NULL,
  phone_number VARCHAR(50) NULL,
  contact_email VARCHAR(255) NULL,
  website VARCHAR(500) NULL,
  canonical_url VARCHAR(500) NULL,
  established_year SMALLINT UNSIGNED NULL,
  receives_general_leads TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_companies_slug (slug),
  UNIQUE KEY uk_companies_owner_user_id (owner_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'dealer', 'company', 'admin') NOT NULL DEFAULT 'user',
  company_id INT UNSIGNED NULL,
  dealer_slug VARCHAR(255) NULL,
  onboarding_ends_at DATETIME NULL,
  is_blocked TINYINT(1) NOT NULL DEFAULT 0,
  deactivated_at DATETIME NULL,
  scheduled_deletion_at DATETIME NULL,
  deletion_reason TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  UNIQUE KEY uk_users_username (username),
  KEY idx_users_company_id (company_id),
  KEY idx_users_role (role),
  CONSTRAINT fk_users_company_id 
    FOREIGN KEY (company_id) REFERENCES companies(id) 
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE companies
  ADD CONSTRAINT fk_companies_owner_user_id
    FOREIGN KEY (owner_user_id) REFERENCES users(id)
    ON DELETE RESTRICT;

-- =============================================================================
-- User-Related Tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
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

CREATE TABLE IF NOT EXISTS user_deactivation_logs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  reason TEXT NULL,
  deactivated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_deactivation_logs_user_id (user_id),
  CONSTRAINT fk_user_deactivation_logs_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Company-Related Tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS company_social_links (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id INT UNSIGNED NOT NULL,
  url VARCHAR(500) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_company_social_links_company_id (company_id),
  CONSTRAINT fk_company_social_links_company_id 
    FOREIGN KEY (company_id) REFERENCES companies(id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS company_quotes (
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

CREATE TABLE IF NOT EXISTS company_reviews (
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

CREATE TABLE IF NOT EXISTS services (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  price DECIMAL(12, 2) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_services_company_id (company_id),
  CONSTRAINT fk_services_company_id 
    FOREIGN KEY (company_id) REFERENCES companies(id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Vehicle-Related Tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS vehicles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lot_number VARCHAR(50) NULL,
  vin VARCHAR(17) NULL,
  year SMALLINT UNSIGNED NULL,
  make VARCHAR(100) NULL,
  model VARCHAR(100) NULL,
  body_style VARCHAR(100) NULL,
  color VARCHAR(50) NULL,
  engine VARCHAR(100) NULL,
  transmission VARCHAR(50) NULL,
  fuel_type VARCHAR(50) NULL,
  odometer INT UNSIGNED NULL,
  odometer_unit VARCHAR(10) NULL,
  damage VARCHAR(255) NULL,
  title_status VARCHAR(50) NULL,
  auction VARCHAR(100) NULL,
  location VARCHAR(255) NULL,
  sale_date DATE NULL,
  estimated_value DECIMAL(12, 2) NULL,
  current_bid DECIMAL(12, 2) NULL,
  buy_now_price DECIMAL(12, 2) NULL,
  thumbnail_url VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_vehicles_vin (vin),
  KEY idx_vehicles_lot_number (lot_number),
  KEY idx_vehicles_make_model (make, model),
  KEY idx_vehicles_sale_date (sale_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicle_photos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vehicle_id BIGINT UNSIGNED NOT NULL,
  url VARCHAR(500) NOT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_vehicle_photos_vehicle_id (vehicle_id),
  CONSTRAINT fk_vehicle_photos_vehicle_id 
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicle_lot_bids (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vehicle_id BIGINT UNSIGNED NOT NULL,
  bid_amount DECIMAL(12, 2) NOT NULL,
  bid_time DATETIME NOT NULL,
  bidder_id VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_vehicle_lot_bids_vehicle_id (vehicle_id),
  KEY idx_vehicle_lot_bids_bid_time (bid_time),
  CONSTRAINT fk_vehicle_lot_bids_vehicle_id 
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicle_makes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_vehicle_makes_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicle_models (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  make_id INT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_vehicle_models_make_id (make_id),
  UNIQUE KEY uk_vehicle_models_make_name (make_id, name),
  CONSTRAINT fk_vehicle_models_make_id 
    FOREIGN KEY (make_id) REFERENCES vehicle_makes(id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- User Favorites & Recent Views
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_favorite_vehicles (
  user_id INT UNSIGNED NOT NULL,
  vehicle_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, vehicle_id),
  KEY idx_user_favorite_vehicles_vehicle_id (vehicle_id),
  CONSTRAINT fk_user_favorite_vehicles_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) 
    ON DELETE CASCADE,
  CONSTRAINT fk_user_favorite_vehicles_vehicle_id 
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_favorite_companies (
  user_id INT UNSIGNED NOT NULL,
  company_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, company_id),
  KEY idx_user_favorite_companies_company_id (company_id),
  CONSTRAINT fk_user_favorite_companies_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) 
    ON DELETE CASCADE,
  CONSTRAINT fk_user_favorite_companies_company_id 
    FOREIGN KEY (company_id) REFERENCES companies(id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_recent_companies (
  user_id INT UNSIGNED NOT NULL,
  company_id INT UNSIGNED NOT NULL,
  viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, company_id),
  KEY idx_user_recent_companies_company_id (company_id),
  KEY idx_user_recent_companies_viewed_at (viewed_at),
  CONSTRAINT fk_user_recent_companies_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) 
    ON DELETE CASCADE,
  CONSTRAINT fk_user_recent_companies_company_id 
    FOREIGN KEY (company_id) REFERENCES companies(id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Inquiry/Chat System
-- =============================================================================

CREATE TABLE IF NOT EXISTS inquiries (
  id CHAR(36) NOT NULL,
  vehicle_id BIGINT UNSIGNED NULL,
  status ENUM('active', 'closed', 'archived') NOT NULL DEFAULT 'active',
  subject VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_message_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_inquiries_vehicle_id (vehicle_id),
  KEY idx_inquiries_status (status),
  KEY idx_inquiries_last_message_at (last_message_at),
  CONSTRAINT fk_inquiries_vehicle_id 
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) 
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inquiry_participants (
  inquiry_id CHAR(36) NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  role ENUM('customer', 'company', 'admin') NOT NULL,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_read_at DATETIME NULL,
  PRIMARY KEY (inquiry_id, user_id),
  KEY idx_inquiry_participants_user_id (user_id),
  CONSTRAINT fk_inquiry_participants_inquiry_id 
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) 
    ON DELETE CASCADE,
  CONSTRAINT fk_inquiry_participants_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inquiry_messages (
  id CHAR(36) NOT NULL,
  inquiry_id CHAR(36) NOT NULL,
  sender_id INT UNSIGNED NOT NULL,
  client_message_id VARCHAR(255) NULL,
  content TEXT NOT NULL,
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inquiry_messages_inquiry_id (inquiry_id),
  KEY idx_inquiry_messages_sender_id (sender_id),
  KEY idx_inquiry_messages_sent_at (sent_at),
  UNIQUE KEY uk_inquiry_messages_client_id (client_message_id),
  CONSTRAINT fk_inquiry_messages_inquiry_id 
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) 
    ON DELETE CASCADE,
  CONSTRAINT fk_inquiry_messages_sender_id 
    FOREIGN KEY (sender_id) REFERENCES users(id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Reference Data Tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS auctions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  country VARCHAR(100) NULL,
  latitude DECIMAL(10, 8) NULL,
  longitude DECIMAL(11, 8) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_auctions_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS yards (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  country VARCHAR(100) NULL,
  latitude DECIMAL(10, 8) NULL,
  longitude DECIMAL(11, 8) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_yards_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ports (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  country VARCHAR(100) NULL,
  latitude DECIMAL(10, 8) NULL,
  longitude DECIMAL(11, 8) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ports_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cities (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(100) NULL,
  country VARCHAR(100) NULL,
  latitude DECIMAL(10, 8) NULL,
  longitude DECIMAL(11, 8) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cities_city_state (city, state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auction_branch_distances (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  auction_id INT UNSIGNED NOT NULL,
  yard_id INT UNSIGNED NOT NULL,
  distance_km DECIMAL(10, 2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_auction_branch_distances (auction_id, yard_id),
  KEY idx_auction_branch_distances_yard_id (yard_id),
  CONSTRAINT fk_auction_branch_distances_auction_id 
    FOREIGN KEY (auction_id) REFERENCES auctions(id) 
    ON DELETE CASCADE,
  CONSTRAINT fk_auction_branch_distances_yard_id 
    FOREIGN KEY (yard_id) REFERENCES yards(id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exchange_rates (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  base_currency VARCHAR(3) NOT NULL,
  target_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(12, 6) NOT NULL,
  rate_date DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_exchange_rates_date_pair (base_currency, target_currency, rate_date),
  KEY idx_exchange_rates_date (rate_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Utility Tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id CHAR(36) NOT NULL,
  user_id INT UNSIGNED NULL,
  endpoint VARCHAR(255) NOT NULL,
  request_hash CHAR(64) NOT NULL,
  response_status SMALLINT UNSIGNED NOT NULL,
  response_body JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_idempotency_keys_user_endpoint (user_id, endpoint),
  KEY idx_idempotency_keys_expires_at (expires_at),
  CONSTRAINT fk_idempotency_keys_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- End of Schema
-- =============================================================================
