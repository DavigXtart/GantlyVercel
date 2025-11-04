-- Script SQL para ejecutar en MySQL Workbench
-- Esto eliminará la entrada fallida de la migración V7 del historial de Flyway

USE psicoapp;

-- Desactivar verificación de claves foráneas temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar la entrada fallida de la versión 7
SET SQL_SAFE_UPDATES = 0;
DELETE FROM flyway_schema_history WHERE version = '7' AND success = 0;
-- También eliminar cualquier entrada de la versión 7 (por si acaso)
DELETE FROM flyway_schema_history WHERE version = '7';
SET SQL_SAFE_UPDATES = 1;

-- Reactivar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar el resultado
SELECT * FROM flyway_schema_history ORDER BY installed_rank;

