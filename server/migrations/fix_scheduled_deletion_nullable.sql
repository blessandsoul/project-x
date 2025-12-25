-- Allow scheduled_deletion_at to be NULL (needed for reactivation)
ALTER TABLE user_deactivation_logs 
MODIFY COLUMN scheduled_deletion_at TIMESTAMP NULL COMMENT '30 days from deactivation - when account will be permanently deleted. NULL if reactivated.';
