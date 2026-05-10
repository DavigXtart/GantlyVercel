-- Add lockout_count column for escalating account lockout durations
ALTER TABLE users ADD COLUMN lockout_count INT NOT NULL DEFAULT 0;
