-- =============================================================================
-- Migration: Create inquiry system tables for user-company communication
-- =============================================================================
-- This migration creates tables for:
-- 1. inquiries - Main inquiry records (user -> company about a vehicle)
-- 2. inquiry_messages - Conversation thread within an inquiry
-- 3. inquiry_participants - Tracks read status per participant
--
-- NOTE: Foreign keys are added separately via ALTER TABLE to avoid type mismatch issues.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: inquiries
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inquiries (
  id INT NOT NULL AUTO_INCREMENT,
  
  -- Foreign keys (types match existing tables)
  user_id INT NOT NULL,
  company_id INT NOT NULL,
  vehicle_id BIGINT NOT NULL,
  quote_id INT NULL,
  
  -- Inquiry status
  status ENUM('pending', 'active', 'accepted', 'declined', 'expired', 'cancelled') NOT NULL DEFAULT 'pending',
  subject VARCHAR(255) NULL,
  
  -- Snapshot of quoted price at inquiry creation
  quoted_total_price DECIMAL(12, 2) NULL,
  quoted_currency CHAR(3) NOT NULL DEFAULT 'USD',
  
  -- Final agreed price (may differ after negotiation)
  final_price DECIMAL(12, 2) NULL,
  final_currency CHAR(3) NULL,
  
  -- Thread metadata
  last_message_at DATETIME(3) NULL,
  
  -- Timestamps
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  expires_at DATETIME(3) NULL,
  
  -- Generated column for unique constraint on open inquiries
  -- MySQL doesn't support partial unique indexes, so we use a generated column
  -- is_open = 1 for pending/active, NULL for terminal states
  -- UNIQUE constraint ignores NULL values, allowing multiple closed inquiries
  is_open TINYINT AS (
    CASE WHEN status IN ('pending', 'active') THEN 1 ELSE NULL END
  ) STORED,
  
  PRIMARY KEY (id),
  
  -- Unique constraint: only one open inquiry per user-company-vehicle
  CONSTRAINT uq_inquiries_open_unique
    UNIQUE (user_id, company_id, vehicle_id, is_open)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign keys separately (allows flexibility with column types)
ALTER TABLE inquiries
  ADD CONSTRAINT fk_inquiries_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE;

ALTER TABLE inquiries
  ADD CONSTRAINT fk_inquiries_company_id
    FOREIGN KEY (company_id) REFERENCES companies(id)
    ON DELETE CASCADE;

ALTER TABLE inquiries
  ADD CONSTRAINT fk_inquiries_vehicle_id
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    ON DELETE CASCADE;

ALTER TABLE inquiries
  ADD CONSTRAINT fk_inquiries_quote_id
    FOREIGN KEY (quote_id) REFERENCES company_quotes(id)
    ON DELETE SET NULL;

-- Indexes for efficient lookups
CREATE INDEX idx_inquiries_user_created ON inquiries(user_id, created_at DESC);
CREATE INDEX idx_inquiries_company_created ON inquiries(company_id, created_at DESC);
CREATE INDEX idx_inquiries_status_updated ON inquiries(status, updated_at DESC);
CREATE INDEX idx_inquiries_vehicle_id ON inquiries(vehicle_id);
CREATE INDEX idx_inquiries_quote_id ON inquiries(quote_id);
CREATE INDEX idx_inquiries_last_message ON inquiries(last_message_at DESC);

-- -----------------------------------------------------------------------------
-- Table: inquiry_messages
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inquiry_messages (
  id INT NOT NULL AUTO_INCREMENT,
  
  -- Foreign keys (types match existing tables)
  inquiry_id INT NOT NULL,
  sender_id INT NOT NULL,
  
  -- Message type for future extensibility (offers, system messages, etc.)
  message_type ENUM('text', 'offer', 'system') NOT NULL DEFAULT 'text',
  
  -- Message content
  message TEXT NOT NULL,
  
  -- Optional attachments (JSON array of {url, name, type, size})
  attachments JSON NULL,
  
  -- Timestamps
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (id),
  
  -- Foreign key constraints
  CONSTRAINT fk_inquiry_messages_inquiry_id
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_inquiry_messages_sender_id
    FOREIGN KEY (sender_id) REFERENCES users(id)
    ON DELETE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for efficient lookups
CREATE INDEX idx_inquiry_messages_inquiry_id ON inquiry_messages(inquiry_id, id);
CREATE INDEX idx_inquiry_messages_sender_created ON inquiry_messages(sender_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- Table: inquiry_participants
-- -----------------------------------------------------------------------------
-- Tracks read status per participant. Avoids per-message is_read boolean.
-- Supports multiple company staff in the future.
CREATE TABLE IF NOT EXISTS inquiry_participants (
  id INT NOT NULL AUTO_INCREMENT,
  
  -- Foreign keys (types match existing tables)
  inquiry_id INT NOT NULL,
  user_id INT NOT NULL,
  
  -- Role within the inquiry context
  role ENUM('user', 'company') NOT NULL,
  
  -- Read tracking: last message ID this participant has read
  last_read_message_id INT NULL,
  last_read_at DATETIME(3) NULL,
  
  -- Timestamps
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (id),
  
  -- Foreign key constraints
  CONSTRAINT fk_inquiry_participants_inquiry_id
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_inquiry_participants_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_inquiry_participants_last_read_message_id
    FOREIGN KEY (last_read_message_id) REFERENCES inquiry_messages(id)
    ON DELETE SET NULL,
  
  -- Each user can only be a participant once per inquiry
  CONSTRAINT uq_inquiry_participants_unique
    UNIQUE (inquiry_id, user_id)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for efficient lookups
CREATE INDEX idx_inquiry_participants_user_updated ON inquiry_participants(user_id, updated_at DESC);
CREATE INDEX idx_inquiry_participants_inquiry_role ON inquiry_participants(inquiry_id, role);


-- =============================================================================
-- Rollback (run manually if needed)
-- =============================================================================
-- DROP TABLE IF EXISTS inquiry_participants;
-- DROP TABLE IF EXISTS inquiry_messages;
-- DROP TABLE IF EXISTS inquiries;
