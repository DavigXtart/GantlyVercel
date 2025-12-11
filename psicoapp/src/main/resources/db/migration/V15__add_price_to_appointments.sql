-- V15: Agregar campo precio a las citas
ALTER TABLE appointments 
ADD COLUMN price DECIMAL(10, 2) NULL;

-- Actualizar citas existentes sin precio a NULL (o un valor por defecto si lo prefieres)
-- UPDATE appointments SET price = NULL WHERE price IS NULL;

