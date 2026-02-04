-- V32: Añadir campo para marcar tareas como completadas/enviadas
ALTER TABLE tasks 
ADD COLUMN completed_at TIMESTAMP NULL COMMENT 'Fecha en que el usuario marcó la tarea como completada/enviada';
