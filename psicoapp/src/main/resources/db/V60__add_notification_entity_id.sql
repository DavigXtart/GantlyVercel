-- Add entity_id to notifications for clickable navigation
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_id BIGINT;
