-- V38: Despachos de clínica y modalidad de cita (presencial/online)

-- Tabla de despachos
CREATE TABLE IF NOT EXISTS clinic_rooms (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#5a9270',
    assigned_psychologist_id BIGINT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clinic_rooms_company ON clinic_rooms(company_id);

-- Modalidad de la cita: ONLINE | PRESENCIAL
ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS modality VARCHAR(20) NOT NULL DEFAULT 'ONLINE';

-- Método de pago (para presencial: STRIPE | CASH)
ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) NOT NULL DEFAULT 'STRIPE';

-- Despacho asignado a la cita (solo para presencial)
ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS room_id BIGINT NULL;
