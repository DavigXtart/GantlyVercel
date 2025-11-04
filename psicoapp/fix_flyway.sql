-- Script para limpiar completamente el historial de Flyway
-- Ejecutar este script en MySQL si la aplicación sigue fallando

USE psicoapp;

-- Ver el historial actual antes de limpiar
SELECT * FROM flyway_schema_history ORDER BY installed_rank;

-- Eliminar entradas problemáticas de V7 y V8
SET SQL_SAFE_UPDATES = 0;
DELETE FROM flyway_schema_history WHERE version = '7';
DELETE FROM flyway_schema_history WHERE version = '8';
SET SQL_SAFE_UPDATES = 1;

-- Verificar que se eliminaron
SELECT * FROM flyway_schema_history ORDER BY installed_rank;
