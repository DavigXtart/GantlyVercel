-- Crear tabla de sesiones temporales para test inicial pre-registro
CREATE TABLE IF NOT EXISTS temporary_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(100) NOT NULL UNIQUE,
  initial_test_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

-- Crear tabla de factores generales
CREATE TABLE IF NOT EXISTS factors (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  test_id BIGINT NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  position INT NOT NULL,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  UNIQUE (test_id, code)
);

-- Crear tabla de subfactores
CREATE TABLE IF NOT EXISTS subfactors (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  test_id BIGINT NOT NULL,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  factor_id BIGINT,
  position INT NOT NULL,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  FOREIGN KEY (factor_id) REFERENCES factors(id) ON DELETE SET NULL,
  UNIQUE (test_id, code)
);

-- Modificar tabla questions para agregar subfactor_id
ALTER TABLE questions 
ADD COLUMN subfactor_id BIGINT,
ADD FOREIGN KEY (subfactor_id) REFERENCES subfactors(id) ON DELETE SET NULL;

-- Modificar tabla user_answers para soportar sesiones temporales
ALTER TABLE user_answers 
MODIFY COLUMN user_id BIGINT NULL, -- Ahora puede ser null para sesiones temporales
ADD COLUMN session_id BIGINT,
ADD FOREIGN KEY (session_id) REFERENCES temporary_sessions(id) ON DELETE CASCADE;

-- Crear tabla de resultados por subfactor
CREATE TABLE IF NOT EXISTS test_results (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  test_id BIGINT NOT NULL,
  subfactor_id BIGINT NOT NULL,
  score DECIMAL(10,2) NOT NULL,
  max_score DECIMAL(10,2) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  FOREIGN KEY (subfactor_id) REFERENCES subfactors(id) ON DELETE CASCADE,
  UNIQUE (user_id, test_id, subfactor_id)
);

-- Crear tabla de resultados por factor general
CREATE TABLE IF NOT EXISTS factor_results (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  test_id BIGINT NOT NULL,
  factor_id BIGINT NOT NULL,
  score DECIMAL(10,2) NOT NULL,
  max_score DECIMAL(10,2) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  FOREIGN KEY (factor_id) REFERENCES factors(id) ON DELETE CASCADE,
  UNIQUE (user_id, test_id, factor_id)
);

-- Crear índice para mejorar rendimiento en consultas de resultados
CREATE INDEX idx_test_results_user_test ON test_results(user_id, test_id);
CREATE INDEX idx_factor_results_user_test ON factor_results(user_id, test_id);
CREATE INDEX idx_user_answers_session ON user_answers(session_id);

