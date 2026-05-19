CREATE TABLE psych_absences (
    id BIGSERIAL PRIMARY KEY,
    psychologist_id BIGINT NOT NULL REFERENCES users(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    reason VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_psych_absences_psych_time ON psych_absences(psychologist_id, start_time, end_time);
