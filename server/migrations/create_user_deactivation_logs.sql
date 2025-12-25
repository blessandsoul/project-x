-- Create user_deactivation_logs table
CREATE TABLE IF NOT EXISTS user_deactivation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reason TEXT NULL COMMENT 'Optional reason provided by user for deactivation',
  deactivated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the account was deactivated',
  deactivated_by_ip VARCHAR(45) NULL COMMENT 'IP address from which deactivation was initiated',
  scheduled_deletion_at TIMESTAMP NOT NULL COMMENT '30 days from deactivation - when account will be permanently deleted',
  reactivated_at TIMESTAMP NULL COMMENT 'If user reactivated, when it happened',
  permanently_deleted_at TIMESTAMP NULL COMMENT 'When account was actually deleted',
  
  INDEX idx_user_id (user_id),
  INDEX idx_scheduled_deletion (scheduled_deletion_at),
  INDEX idx_deactivated_at (deactivated_at),
  INDEX idx_reactivated_at (reactivated_at),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks user account deactivations and deletions';
