-- Clinic patient profiles
CREATE TABLE IF NOT EXISTS clinic_patient_profiles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    patient_number INT,
    notes TEXT,
    allergies TEXT,
    medication TEXT,
    medical_history TEXT,
    consent_signed BOOLEAN DEFAULT FALSE,
    patient_type VARCHAR(20) DEFAULT 'PRIVATE',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_company_patient (company_id, patient_id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (patient_id) REFERENCES users(id)
);

-- Add service and clinic_notes columns to appointments
ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS service VARCHAR(100) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS clinic_notes VARCHAR(500) DEFAULT NULL;
