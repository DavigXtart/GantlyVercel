-- Agregar campos category y topic a la tabla tests
ALTER TABLE tests 
ADD COLUMN category VARCHAR(100) NULL,
ADD COLUMN topic VARCHAR(100) NULL;

-- Actualizar tests existentes para que tengan valores por defecto si es necesario
-- Los tests existentes pueden quedar sin categoría/topic inicialmente

