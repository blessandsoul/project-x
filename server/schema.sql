-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_created_at (created_at)
);

-- User favorite vehicles (watchlist)
CREATE TABLE IF NOT EXISTS user_favorite_vehicles (
  user_id INT NOT NULL,
  vehicle_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id, vehicle_id),
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- User onboarding preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id INT PRIMARY KEY,
  budget_min INT,
  budget_max INT,
  body_types JSON,
  fuel_types JSON,
  usage_goal ENUM('family', 'commute', 'resale', 'fun', 'other'),
  target_regions JSON,
  purchase_timeframe ENUM('immediate', '1-3_months', '3-6_months', 'planning'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Dealer onboarding profiles
CREATE TABLE IF NOT EXISTS dealer_profiles (
  user_id INT PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(50),
  license_number VARCHAR(50),
  address JSON,
  inventory_size ENUM('0-10', '10-50', '50+'),
  specialty_brands JSON,
  feed_url VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_dealer_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Optional: Create a sessions table if you want to implement session-based auth later
-- CREATE TABLE IF NOT EXISTS sessions (
--   id VARCHAR(255) PRIMARY KEY,
--   user_id INT NOT NULL,
--   expires_at TIMESTAMP NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--
--   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
--   INDEX idx_user_id (user_id),
--   INDEX idx_expires_at (expires_at)
-- );
