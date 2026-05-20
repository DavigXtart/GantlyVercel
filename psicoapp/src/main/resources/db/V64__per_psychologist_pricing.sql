-- UX-26: Per-psychologist pricing on clinic services
ALTER TABLE clinic_services ADD COLUMN psychologist_prices TEXT;
COMMENT ON COLUMN clinic_services.psychologist_prices IS 'JSON map: psychologistId -> custom price override';
