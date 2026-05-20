-- V61: RGPD consent withdrawal + guardian consent + patient intake fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS health_data_consent_withdrawn_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS guardian_email VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS guardian_consent_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_source VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS chief_complaint VARCHAR(1000);
