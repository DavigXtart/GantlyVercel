-- V69: Patient notes, discharge reason, psychologist defaults

-- Psychologist free-form notes about a patient
ALTER TABLE user_psychologist ADD COLUMN IF NOT EXISTS psychologist_notes TEXT;

-- Discharge tracking
ALTER TABLE user_psychologist ADD COLUMN IF NOT EXISTS discharge_reason TEXT;
ALTER TABLE user_psychologist ADD COLUMN IF NOT EXISTS discharged_at TIMESTAMP WITH TIME ZONE;

-- Psychologist default service and price for slot creation
ALTER TABLE psychologist_profiles ADD COLUMN IF NOT EXISTS default_service VARCHAR(100);
ALTER TABLE psychologist_profiles ADD COLUMN IF NOT EXISTS default_price DECIMAL(10,2);
