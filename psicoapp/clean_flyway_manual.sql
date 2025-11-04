-- Script SQL para ejecutar manualmente en MySQL
-- Abre MySQL Workbench o la línea de comandos de MySQL y ejecuta estos comandos:

USE psicoapp;

-- Desactivar verificación de claves foráneas temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar entradas problemáticas de Flyway
SET SQL_SAFE_UPDATES = 0;
DELETE FROM flyway_schema_history WHERE version = '7';
DELETE FROM flyway_schema_history WHERE version = '8';
SET SQL_SAFE_UPDATES = 1;

-- Reactivar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar el resultado
SELECT * FROM flyway_schema_history ORDER BY installed_rank;

