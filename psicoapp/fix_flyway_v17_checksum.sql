-- Script SQL para corregir el checksum de la migración V17 en Flyway
-- Ejecutar este script en MySQL Workbench o en la línea de comandos de MySQL

USE psicoapp;

-- Desactivar modo seguro temporalmente (solo para esta sesión)
SET SQL_SAFE_UPDATES = 0;

-- Actualizar el checksum de la migración V17 al nuevo valor
-- Esto permite que Flyway acepte la migración modificada
UPDATE flyway_schema_history 
SET checksum = 159510598 
WHERE version = '17' AND installed_rank = (SELECT installed_rank FROM (SELECT installed_rank FROM flyway_schema_history WHERE version = '17') AS temp);

-- Reactivar modo seguro
SET SQL_SAFE_UPDATES = 1;

-- Verificar el resultado
SELECT version, description, checksum, success, installed_rank
FROM flyway_schema_history 
WHERE version = '17';

