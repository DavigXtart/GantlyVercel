-- Sistema de solicitudes de citas y confirmación por psicólogo

-- Tabla para solicitudes de citas (múltiples pacientes pueden solicitar la misma cita)
CREATE TABLE IF NOT EXISTS appointment_requests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  appointment_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, REJECTED
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_user_appointment_request UNIQUE (appointment_id, user_id)
);

-- Agregar campos a appointments para manejo de confirmación y pago
ALTER TABLE appointments 
  ADD COLUMN confirmed_at TIMESTAMP NULL,
  ADD COLUMN payment_deadline TIMESTAMP NULL,
  ADD COLUMN payment_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PAID, EXPIRED
  ADD COLUMN confirmed_by_user_id BIGINT NULL,
  ADD CONSTRAINT fk_confirmed_by_user FOREIGN KEY (confirmed_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Actualizar el estado para incluir REQUESTED y CONFIRMED
-- Los estados ahora serán: FREE, REQUESTED, CONFIRMED, BOOKED, CANCELLED
-- REQUESTED: cuando hay solicitudes pendientes
-- CONFIRMED: cuando el psicólogo confirma una solicitud
-- BOOKED: se mantiene para compatibilidad con el sistema anterior

-- Índices para mejorar rendimiento
CREATE INDEX idx_appointment_requests_appointment ON appointment_requests(appointment_id);
CREATE INDEX idx_appointment_requests_user ON appointment_requests(user_id);
CREATE INDEX idx_appointment_requests_status ON appointment_requests(status);
CREATE INDEX idx_appointments_payment_deadline ON appointments(payment_deadline);
CREATE INDEX idx_appointments_confirmed_by ON appointments(confirmed_by_user_id);

