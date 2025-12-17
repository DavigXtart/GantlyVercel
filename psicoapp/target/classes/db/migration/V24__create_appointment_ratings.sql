-- Tabla para valoraciones de citas
CREATE TABLE IF NOT EXISTS appointment_ratings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  appointment_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  psychologist_id BIGINT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (psychologist_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_appointment_rating UNIQUE (appointment_id, user_id)
);

-- Índice para búsquedas rápidas por psicólogo
CREATE INDEX idx_ratings_psychologist ON appointment_ratings(psychologist_id);

