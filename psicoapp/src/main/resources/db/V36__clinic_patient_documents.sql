CREATE TABLE IF NOT EXISTS clinic_patient_documents (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    uploaded_by_email VARCHAR(255),
    uploaded_at DATETIME(6) NOT NULL,
    INDEX idx_clinic_docs_patient (company_id, patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
