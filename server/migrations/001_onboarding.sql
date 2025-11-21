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

