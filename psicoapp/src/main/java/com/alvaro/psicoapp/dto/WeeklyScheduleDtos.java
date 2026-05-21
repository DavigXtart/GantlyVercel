package com.alvaro.psicoapp.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class WeeklyScheduleDtos {

    public record DayScheduleDto(
        int dayOfWeek,      // 0=Mon...6=Sun
        boolean enabled,
        String startTime1,  // "HH:mm"
        String endTime1,
        String startTime2,  // nullable
        String endTime2     // nullable
    ) {}

    public static class SaveScheduleRequest {
        @NotNull(message = "La lista de días es requerida")
        @Valid
        public List<DayScheduleDto> days;
    }

    public record GenerateResult(
        int slotsCreated,
        int slotsSkipped
    ) {}
}
