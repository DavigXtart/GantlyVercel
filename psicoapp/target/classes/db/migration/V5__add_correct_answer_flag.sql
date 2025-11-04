-- Añadir campo para marcar respuestas correctas
ALTER TABLE answers 
ADD COLUMN is_correct BOOLEAN DEFAULT FALSE;

