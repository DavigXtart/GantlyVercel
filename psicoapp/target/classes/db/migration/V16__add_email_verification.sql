-- V16: Agregar campos de verificación de email
ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_token VARCHAR(255) NULL,
ADD COLUMN verification_token_expires_at TIMESTAMP NULL;

-- Crear índice para búsquedas rápidas por token
CREATE INDEX idx_verification_token ON users(verification_token);

