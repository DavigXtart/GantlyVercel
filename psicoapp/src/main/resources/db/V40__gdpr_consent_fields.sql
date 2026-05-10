ALTER TABLE users ADD COLUMN gdpr_consent_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN gdpr_consent_version VARCHAR(20) NULL;
