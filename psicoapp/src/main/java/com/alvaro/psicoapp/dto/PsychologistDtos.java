package com.alvaro.psicoapp.dto;

import java.time.Instant;
import java.util.List;

/**
 * DTOs para el módulo de psicólogo.
 */
public final class PsychologistDtos {

    private PsychologistDtos() {}

    /** Resumen de un paciente para la lista del psicólogo */
    public record PatientSummaryDto(
            Long id,
            String name,
            String email,
            String avatarUrl,
            String gender,
            Integer age,
            String status,
            Instant assignedAt,
            Instant lastVisit
    ) {}

    /** Respuesta de una pregunta de test */
    public record AnswerInfoDto(
            Long questionId,
            String questionText,
            Integer questionPosition,
            String questionType,
            Long answerId,
            String answerText,
            Integer answerValue,
            Double numericValue,
            String textValue,
            Instant createdAt
    ) {}

    /** Test con sus respuestas (para detalle de paciente) */
    public record TestWithAnswersDto(
            Long testId,
            String testCode,
            String testTitle,
            List<AnswerInfoDto> answers
    ) {}

    /** Detalle completo de un paciente */
    public record PatientDetailDto(
            Long id,
            String name,
            String email,
            String role,
            Instant createdAt,
            String gender,
            Integer age,
            String avatarUrl,
            List<TestWithAnswersDto> tests
    ) {}

    /** Respuestas de un test específico de un paciente */
    public record PatientTestAnswersDto(
            Long testId,
            String testCode,
            String testTitle,
            List<AnswerInfoDto> answers
    ) {}

    /** Perfil del psicólogo */
    public record PsychologistProfileDto(
            Long userId,
            String name,
            String email,
            String avatarUrl,
            String gender,
            Integer age,
            Boolean isFull,
            String bio,
            String education,
            String certifications,
            String interests,
            String specializations,
            String experience,
            String languages,
            String linkedinUrl,
            String website,
            String sessionPrices,
            Instant updatedAt
    ) {}

    /** Request para actualizar perfil del psicólogo */
    public record PsychologistProfileUpdateRequest(
            String bio,
            String education,
            String certifications,
            String interests,
            String specializations,
            String experience,
            String languages,
            String linkedinUrl,
            String website,
            String sessionPrices
    ) {}

    /** Request para actualizar flag isFull */
    public record UpdateIsFullRequest(Boolean isFull) {}

    /** Request para actualizar status del paciente */
    public record UpdatePatientStatusRequest(String status) {}

    /** Respuesta simple con mensaje */
    public record MessageResponse(String message) {}

    /** Respuesta de actualización de isFull */
    public record UpdateIsFullResponse(String message, Boolean isFull) {}

    /** Respuesta de actualización de status del paciente */
    public record UpdatePatientStatusResponse(String message, String status) {}
}
