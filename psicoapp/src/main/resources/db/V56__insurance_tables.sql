CREATE TABLE insurance_companies (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    name VARCHAR(200) NOT NULL,
    nif VARCHAR(20),
    address VARCHAR(500),
    phone VARCHAR(30),
    email VARCHAR(255),
    contact_person VARCHAR(200),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_insurance_companies_company ON insurance_companies(company_id);

CREATE TABLE insurance_patient_policies (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES users(id),
    insurance_company_id BIGINT NOT NULL REFERENCES insurance_companies(id),
    policy_number VARCHAR(50) NOT NULL,
    holder_name VARCHAR(200),
    expiration_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (patient_id, insurance_company_id)
);
CREATE INDEX idx_insurance_policies_patient ON insurance_patient_policies(patient_id);

ALTER TABLE appointments ADD COLUMN insurance_policy_id BIGINT REFERENCES insurance_patient_policies(id);
ALTER TABLE appointments ADD COLUMN billing_type VARCHAR(20) DEFAULT 'PRIVATE';
