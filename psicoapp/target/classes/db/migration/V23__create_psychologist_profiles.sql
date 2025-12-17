-- Tabla para perfiles detallados de psicólogos (estilo LinkedIn)
CREATE TABLE IF NOT EXISTS psychologist_profiles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL UNIQUE,
  bio TEXT,
  education TEXT, -- JSON array: [{"institution": "...", "degree": "...", "field": "...", "startDate": "...", "endDate": "..."}]
  certifications TEXT, -- JSON array: [{"name": "...", "issuer": "...", "date": "...", "credentialId": "..."}]
  interests TEXT, -- JSON array: ["interés1", "interés2", ...]
  specializations TEXT, -- JSON array: ["especialización1", "especialización2", ...]
  experience TEXT, -- JSON array: [{"title": "...", "company": "...", "description": "...", "startDate": "...", "endDate": "..."}]
  languages TEXT, -- JSON array: [{"language": "...", "level": "..."}]
  linkedin_url VARCHAR(500),
  website VARCHAR(500),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_psychologist_profile_user (user_id)
);

