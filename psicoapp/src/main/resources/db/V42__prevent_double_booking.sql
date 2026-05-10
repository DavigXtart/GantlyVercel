-- Prevent double-booking: only one active appointment per psychologist per time slot.
-- PostgreSQL partial unique index: covers BOOKED and CONFIRMED statuses.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_appointment
ON appointments (psychologist_id, start_time)
WHERE status IN ('BOOKED', 'CONFIRMED');
