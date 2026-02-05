package com.alvaro.psicoapp.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class CalendarDtos {

    // --- Response DTOs ---
    public record PsychologistSummary(Long id, String name, String email) {}
    /** Item para lista mixta de citas confirmadas y solicitadas */
    public record AppointmentListItemDto(Long id, Long requestId, String startTime, String endTime, String status, BigDecimal price,
                                         String paymentStatus, String paymentDeadline, String confirmedAt, String requestedAt,
                                         PsychologistSummary psychologist) {}
    public record AppointmentDto(Long id, String startTime, String endTime, String status, BigDecimal price,
                                String paymentStatus, String paymentDeadline, String confirmedAt, PsychologistSummary psychologist) {}
    public record RequestedAppointmentDto(Long id, Long requestId, String startTime, String endTime, String status,
                                         BigDecimal price, String requestedAt, PsychologistSummary psychologist) {}
    public record PendingUserDto(Long id, String name, String email) {}
    public record PendingAppointmentDto(Long id, String startTime, String endTime, BigDecimal price) {}
    public record PendingRequestDto(Long id, Long appointmentId, String requestedAt, String status,
                                   PendingUserDto user, PendingAppointmentDto appointment) {}
    public record RatingDto(Long id, Integer rating, String comment, String createdAt) {}
    public record PastAppointmentDto(Long id, Instant startTime, Instant endTime, String status, BigDecimal price,
                                    PsychologistSummary psychologist, RatingDto rating) {}
    public record PastUserDto(Long id, String name, String email) {}
    public record PsychologistPastAppointmentDto(Long id, Instant startTime, Instant endTime, String status, BigDecimal price,
                                                 PastUserDto user, RatingDto rating) {}
    public record CreateForPatientResponse(Long id, String startTime, String endTime, String status, Long userId, Long psychologistId) {}
    public record RateAppointmentResponse(String message, RatingDto rating) {}
    public record PsychologistRatingResponse(Double averageRating, long totalRatings) {}
    public record MessageResponse(String message) {}
    public record UpdateSlotResponse(String message, com.alvaro.psicoapp.domain.AppointmentEntity appointment) {}

    public static class CreateSlotRequest {
        @NotNull(message = "La fecha de inicio es requerida")
        public Instant start;
        @NotNull(message = "La fecha de fin es requerida")
        public Instant end;
        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.01", message = "El precio debe ser mayor a 0")
        public BigDecimal price;
    }

    public static class UpdateSlotRequest {
        public BigDecimal price;
        public Instant startTime;
        public Instant endTime;
    }

    public static class CreateForPatientRequest {
        @NotNull(message = "El userId es requerido")
        public Long userId;
        @NotNull(message = "La fecha de inicio es requerida")
        public Instant start;
        @NotNull(message = "La fecha de fin es requerida")
        public Instant end;
        public BigDecimal price;
    }

    public static class RateAppointmentRequest {
        @NotNull(message = "La valoración es requerida")
        @Min(value = 1, message = "La valoración debe estar entre 1 y 5")
        @Max(value = 5, message = "La valoración debe estar entre 1 y 5")
        public Integer rating;
        public String comment;
    }
}
