-- =============================================================================
-- Migration: Create user_sessions table for secure session management
-- =============================================================================
-- This table stores refresh token sessions for HttpOnly cookie-based auth.
-- Only SHA-256 hashes of refresh tokens are stored, never raw tokens.
-- Supports multi-device sessions, audit logging, and session revocation.
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  -- Primary key: UUID for session ID
  id CHAR(36) NOT NULL,
  
  -- Foreign key to users table
  user_id INT NOT NULL,
  
  -- SHA-256 hash of the refresh token (64 hex chars)
  refresh_hash CHAR(64) NOT NULL,
  
  -- Client metadata for audit/security
  user_agent VARCHAR(512) NULL,
  ip VARCHAR(45) NULL,
  
  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  
  -- Revocation tracking
  revoked_at DATETIME NULL,
  
  -- Token rotation: points to the session that replaced this one
  replaced_by CHAR(36) NULL,
  
  PRIMARY KEY (id),
  
  -- Foreign key constraint
  CONSTRAINT fk_user_sessions_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) 
    ON DELETE CASCADE,
  
  -- Self-referential FK for rotation tracking
  CONSTRAINT fk_user_sessions_replaced_by 
    FOREIGN KEY (replaced_by) REFERENCES user_sessions(id) 
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Indexes for efficient lookups
-- =============================================================================

-- Fast lookup by user_id (list all sessions for a user)
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);

-- Fast lookup by refresh_hash (token validation)
CREATE INDEX idx_user_sessions_refresh_hash ON user_sessions(refresh_hash);

-- Cleanup expired sessions
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Find active (non-revoked) sessions
CREATE INDEX idx_user_sessions_revoked_at ON user_sessions(revoked_at);
