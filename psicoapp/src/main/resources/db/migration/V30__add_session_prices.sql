-- V30: Añadir precios por tipo de sesión a psychologist_profiles
ALTER TABLE psychologist_profiles 
ADD COLUMN session_prices TEXT NULL COMMENT 'JSON: {"individual": 45, "pareja": 100, "menores": 50}';
