-- Migración V9: Actualizar códigos de factores de COMPETENCIAS_* a versiones en minúsculas
-- Actualiza los códigos existentes en la base de datos

UPDATE factors 
SET code = 'sociales' 
WHERE code = 'COMPETENCIAS_SOCIALES';

UPDATE factors 
SET code = 'autonomia' 
WHERE code = 'COMPETENCIAS_AUTONOMIA';

UPDATE factors 
SET code = 'apertura' 
WHERE code = 'COMPETENCIAS_APERTURA';

UPDATE factors 
SET code = 'autocontrol' 
WHERE code = 'COMPETENCIAS_AUTOCONTROL';

UPDATE factors 
SET code = 'ansiedad' 
WHERE code = 'COMPETENCIAS_ANSIEDAD';

