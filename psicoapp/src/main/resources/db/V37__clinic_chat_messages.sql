CREATE TABLE IF NOT EXISTS clinic_chat_messages (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    sender VARCHAR(10) NOT NULL COMMENT 'CLINIC or PATIENT',
    content TEXT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_clinic_chat (company_id, patient_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
