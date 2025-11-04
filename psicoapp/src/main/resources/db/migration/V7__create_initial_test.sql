-- V7: Crear el test inicial vacío (solo si no existe)
-- La migración V8 se encargará de poblar el test con factores, subfactores y preguntas

INSERT INTO tests (code, title, description, active, created_at) 
SELECT 'INITIAL', 'Test Inicial de Personalidad', 'Test básico de personalidad para nuevos usuarios', TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM tests WHERE code = 'INITIAL');
