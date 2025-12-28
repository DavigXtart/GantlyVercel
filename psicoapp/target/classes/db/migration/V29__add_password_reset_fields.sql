-- V29: Agregar campos para recuperación de contraseña
ALTER TABLE users 
ADD COLUMN password_reset_token VARCHAR(255) NULL,
ADD COLUMN password_reset_token_expires_at TIMESTAMP NULL;

-- Crear índice para búsquedas rápidas por token de reset
CREATE INDEX idx_password_reset_token ON users(password_reset_token);

