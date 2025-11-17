-- Agregar fecha de entrega a las tareas
ALTER TABLE tasks ADD COLUMN due_date TIMESTAMP NULL;
ALTER TABLE tasks ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE;

-- Tabla para tests asignados a pacientes por psicólogos
CREATE TABLE IF NOT EXISTS assigned_tests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  psychologist_id BIGINT NOT NULL,
  test_id BIGINT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (psychologist_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_test (user_id, test_id)
);

