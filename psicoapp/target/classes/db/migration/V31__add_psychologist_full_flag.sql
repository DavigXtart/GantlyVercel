-- V31: Añadir campo para indicar si el psicólogo está lleno (no acepta nuevos pacientes)
ALTER TABLE users 
ADD COLUMN is_full BOOLEAN DEFAULT FALSE COMMENT 'Para psicólogos: indica si está lleno y no acepta nuevos pacientes';
