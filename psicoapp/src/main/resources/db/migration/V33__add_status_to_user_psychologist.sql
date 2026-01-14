-- V33: Añadir campo status a user_psychologist para distinguir pacientes activos y dados de alta
ALTER TABLE user_psychologist 
ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE' COMMENT 'Estado del paciente: ACTIVE (activo) o DISCHARGED (dado de alta)';
