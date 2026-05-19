CREATE TABLE waiting_list (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    patient_id BIGINT REFERENCES users(id),
    patient_name VARCHAR(200) NOT NULL,
    patient_email VARCHAR(255),
    patient_phone VARCHAR(30),
    requested_service_id BIGINT REFERENCES clinic_services(id),
    psychologist_preference_id BIGINT REFERENCES users(id),
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    contacted_at TIMESTAMPTZ,
    scheduled_appointment_id BIGINT REFERENCES appointments(id)
);
CREATE INDEX idx_waiting_list_company_status ON waiting_list(company_id, status);
