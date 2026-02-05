-- Migración para OAuth2: añadir columnas a la tabla users
-- Ejecuta este script en tu base de datos MySQL (gantly) antes de arrancar el backend

USE gantly;

-- Permitir password_hash NULL para usuarios OAuth
ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;

-- Añadir columnas OAuth2
ALTER TABLE users ADD COLUMN oauth2_provider VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN oauth2_provider_id VARCHAR(255) NULL;
