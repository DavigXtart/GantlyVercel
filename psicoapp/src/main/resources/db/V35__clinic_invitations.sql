CREATE TABLE IF NOT EXISTS clinic_invitations (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME(6) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    INDEX idx_clinic_invitations_company (company_id),
    INDEX idx_clinic_invitations_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
