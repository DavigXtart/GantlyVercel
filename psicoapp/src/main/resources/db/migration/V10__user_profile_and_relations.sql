-- Perfil de usuario y relaciones para psicólogos, tareas, citas y chat

-- Perfil de usuario: avatar y preferencias básicas
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL;
ALTER TABLE users ADD COLUMN dark_mode BOOLEAN DEFAULT FALSE;

-- Asignación usuario-psicólogo (un usuario tiene 0..1 psicólogo asignado)
CREATE TABLE IF NOT EXISTS user_psychologist (
  user_id BIGINT PRIMARY KEY,
  psychologist_id BIGINT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (psychologist_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Tareas entre psicólogo y usuario
CREATE TABLE IF NOT EXISTS tasks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  psychologist_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  created_by VARCHAR(20) NOT NULL, -- USER o PSYCHOLOGIST
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (psychologist_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Archivos de tareas
CREATE TABLE IF NOT EXISTS task_files (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  task_id BIGINT NOT NULL,
  uploader_user_id BIGINT NOT NULL,
  file_path VARCHAR(1000) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NULL,
  file_size BIGINT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (uploader_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Citas / calendario del psicólogo (slots libres o reservados)
CREATE TABLE IF NOT EXISTS appointments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  psychologist_id BIGINT NOT NULL,
  user_id BIGINT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'FREE', -- FREE, BOOKED, CANCELLED
  notes VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (psychologist_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT uq_psychologist_slot UNIQUE (psychologist_id, start_time, end_time)
);

-- Mensajes de chat entre psicólogo y usuario asignado
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  psychologist_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  sender VARCHAR(20) NOT NULL, -- USER o PSYCHOLOGIST
  content TEXT,
  attachment_path VARCHAR(1000) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (psychologist_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


