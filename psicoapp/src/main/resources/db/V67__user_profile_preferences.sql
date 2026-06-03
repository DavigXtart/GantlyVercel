-- Add patient preference fields extracted from initial test survey
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_schedule VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_budget VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS therapy_urgency VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_psych_gender VARCHAR(50);
