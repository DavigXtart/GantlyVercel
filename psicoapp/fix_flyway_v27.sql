-- Script SQL para ejecutar en MySQL Workbench o cliente MySQL
-- Esto eliminará la entrada fallida de la migración V27 del historial de Flyway
-- Ejecutar ANTES de intentar ejecutar la aplicación nuevamente

USE psicoapp;

-- Ver el estado actual de la migración V27
SELECT version, description, type, installed_on, success, checksum
FROM flyway_schema_history 
WHERE version = '27'
ORDER BY installed_rank DESC;

-- Eliminar la entrada fallida de la versión 27
SET SQL_SAFE_UPDATES = 0;
DELETE FROM flyway_schema_history WHERE version = '27' AND success = 0;
-- También eliminar cualquier entrada de la versión 27 (por si acaso hay duplicados)
DELETE FROM flyway_schema_history WHERE version = '27';
SET SQL_SAFE_UPDATES = 1;

-- Verificar el resultado
SELECT version, description, type, installed_on, success
FROM flyway_schema_history 
ORDER BY installed_rank DESC
LIMIT 5;

