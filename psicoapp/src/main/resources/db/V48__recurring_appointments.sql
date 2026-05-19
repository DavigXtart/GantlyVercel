ALTER TABLE appointments ADD COLUMN recurrence_group_id VARCHAR(36);
ALTER TABLE appointments ADD COLUMN recurrence_rule VARCHAR(20);
CREATE INDEX idx_appointments_recurrence ON appointments(recurrence_group_id);
