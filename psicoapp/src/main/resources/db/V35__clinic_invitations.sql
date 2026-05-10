CREATE TABLE IF NOT EXISTS clinic_invitations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP(6) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL
);

CREATE INDEX idx_clinic_invitations_company ON clinic_invitations(company_id);
CREATE INDEX idx_clinic_invitations_token ON clinic_invitations(token);
