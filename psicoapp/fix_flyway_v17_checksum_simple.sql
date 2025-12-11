-- Script SQL simplificado para corregir el checksum de la migración V17
-- Ejecutar este script en MySQL Workbench
-- NOTA: Este script actualiza el checksum al valor ORIGINAL (1543505494) 
-- porque revertimos V17 a su estado original

USE psicoapp;

-- Desactivar modo seguro temporalmente
SET SQL_SAFE_UPDATES = 0;

-- Actualizar el checksum al valor ORIGINAL (el que tiene el archivo V17 revertido)
UPDATE flyway_schema_history 
SET checksum = 1543505494 
WHERE version = '17';

-- Reactivar modo seguro
SET SQL_SAFE_UPDATES = 1;

-- Verificar
SELECT version, description, checksum, success 
FROM flyway_schema_history 
WHERE version = '17';

