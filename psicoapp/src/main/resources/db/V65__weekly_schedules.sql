CREATE TABLE weekly_schedules (
    id BIGSERIAL PRIMARY KEY,
    psychologist_id BIGINT NOT NULL REFERENCES users(id),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time_1 VARCHAR(5) NOT NULL,
    end_time_1 VARCHAR(5) NOT NULL,
    start_time_2 VARCHAR(5),
    end_time_2 VARCHAR(5),
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (psychologist_id, day_of_week)
);
