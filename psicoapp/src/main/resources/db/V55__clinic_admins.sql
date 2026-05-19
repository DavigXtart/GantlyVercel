CREATE TABLE clinic_admins (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    role VARCHAR(20) NOT NULL DEFAULT 'ADMIN',
    invited_by_email VARCHAR(255),
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'INVITED',
    UNIQUE (company_id, user_id)
);
CREATE INDEX idx_clinic_admins_user ON clinic_admins(user_id, status);
