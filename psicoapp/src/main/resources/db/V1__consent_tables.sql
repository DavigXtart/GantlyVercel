-- Tablas para consentimientos (menores de edad).
-- Ejecutar este script si usas ddl-auto: validate y no quieres usar update.

-- Tipo de documento de consentimiento (plantilla con placeholders)
CREATE TABLE IF NOT EXISTS consent_document_types (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  template TEXT NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NULL
);

-- Solicitudes de consentimiento (envío y firma)
CREATE TABLE IF NOT EXISTS consent_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  psychologist_id BIGINT NOT NULL,
  document_type_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  place VARCHAR(200) NULL,
  sent_at TIMESTAMP(6) NULL,
  signed_at TIMESTAMP(6) NULL,
  signer_name VARCHAR(200) NULL,
  rendered_content TEXT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NULL,
  CONSTRAINT fk_consent_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_consent_psychologist FOREIGN KEY (psychologist_id) REFERENCES users(id),
  CONSTRAINT fk_consent_document_type FOREIGN KEY (document_type_id) REFERENCES consent_document_types(id)
);

CREATE INDEX idx_consent_requests_user_status ON consent_requests(user_id, status);
CREATE INDEX idx_consent_requests_psych_user ON consent_requests(psychologist_id, user_id);
