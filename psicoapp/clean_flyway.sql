-- Script SQL para ejecutar manualmente en MySQL
-- Conecta a MySQL y ejecuta estos comandos:

USE psicoapp;

-- Eliminar entradas problemáticas de Flyway
SET SQL_SAFE_UPDATES = 0;
DELETE FROM flyway_schema_history WHERE version = '7';
DELETE FROM flyway_schema_history WHERE version = '8';
SET SQL_SAFE_UPDATES = 1;

-- Verificar el resultado
SELECT * FROM flyway_schema_history ORDER BY installed_rank;

