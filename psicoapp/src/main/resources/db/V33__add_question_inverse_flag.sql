-- Add inverse flag to questions for reverse-scored items
ALTER TABLE questions ADD COLUMN inverse BOOLEAN NOT NULL DEFAULT FALSE;
