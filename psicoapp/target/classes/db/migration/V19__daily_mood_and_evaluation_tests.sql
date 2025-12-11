-- Tabla para registro diario de estado de ánimo y actividades
CREATE TABLE IF NOT EXISTS daily_mood_entries (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  entry_date DATE NOT NULL,
  mood_rating INT NOT NULL, -- 1-5 (muy triste a muy feliz)
  emotions TEXT, -- JSON array de emociones seleccionadas
  activities TEXT, -- JSON array de actividades
  companions TEXT, -- JSON array de compañeros
  location VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_user_date UNIQUE (user_id, entry_date)
);

-- Tabla para tests de evaluación por tema
CREATE TABLE IF NOT EXISTS evaluation_tests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- 'EVALUATION' o 'DISCOVERY'
  topic VARCHAR(100) NOT NULL, -- 'Ansiedad', 'Depresión', etc.
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla para resultados de tests de evaluación
CREATE TABLE IF NOT EXISTS evaluation_test_results (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  test_id BIGINT NOT NULL,
  session_id VARCHAR(100),
  score DECIMAL(10, 2),
  level VARCHAR(50), -- 'Bajo', 'Moderado', 'Alto', etc.
  answers TEXT, -- JSON con las respuestas
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (test_id) REFERENCES evaluation_tests(id) ON DELETE CASCADE
);

-- Índices para mejor rendimiento
CREATE INDEX idx_daily_mood_user_date ON daily_mood_entries(user_id, entry_date);
CREATE INDEX idx_evaluation_results_user ON evaluation_test_results(user_id, completed_at);
CREATE INDEX idx_evaluation_results_test ON evaluation_test_results(test_id);
CREATE INDEX idx_evaluation_tests_category_topic ON evaluation_tests(category, topic, active);

