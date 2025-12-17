-- =============================================================================
-- Migration: Add client_message_id to inquiry_messages for optimistic UI
-- =============================================================================
-- This allows clients to send a UUID with each message for:
-- 1. Idempotent message sending (retry without duplicates)
-- 2. Matching optimistic UI messages with server responses
-- =============================================================================

-- Add client_message_id column
ALTER TABLE inquiry_messages
  ADD COLUMN client_message_id VARCHAR(36) NULL AFTER sender_id;

-- Add unique index for idempotency (one client_message_id per inquiry)
CREATE UNIQUE INDEX idx_inquiry_messages_client_id 
  ON inquiry_messages(inquiry_id, client_message_id);

-- =============================================================================
-- Rollback (run manually if needed)
-- =============================================================================
-- DROP INDEX idx_inquiry_messages_client_id ON inquiry_messages;
-- ALTER TABLE inquiry_messages DROP COLUMN client_message_id;
