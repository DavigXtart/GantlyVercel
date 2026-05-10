CREATE TABLE IF NOT EXISTS clinic_patient_documents (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    uploaded_by_email VARCHAR(255),
    uploaded_at TIMESTAMP(6) NOT NULL
);

CREATE INDEX idx_clinic_docs_patient ON clinic_patient_documents(company_id, patient_id);
