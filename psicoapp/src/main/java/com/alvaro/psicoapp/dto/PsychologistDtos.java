package com.alvaro.psicoapp.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class PsychologistDtos {

    private PsychologistDtos() {}

    public record PatientSummaryDto(
            Long id,
            String name,
            String email,
            String avatarUrl,
            String gender,
            Integer age,
            LocalDate birthDate,
            @JsonProperty("isMinor") Boolean isMinor,
            String consentStatus,
            Long latestConsentId,
            String status,
            Instant assignedAt,
            Instant lastVisit
    ) {}

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

    public record TestWithAnswersDto(
            Long testId,
            String testCode,
            String testTitle,
            List<AnswerInfoDto> answers
    ) {}

    public record EvaluationTestSummaryDto(
            Long resultId,
            Long testId,
            String testCode,
            String testTitle,
            String category,
            String topic,
            BigDecimal score,
            String level,
            Instant completedAt
    ) {}

    public record PatientDetailDto(
            Long id,
            String name,
            String email,
            String role,
            Instant createdAt,
            String gender,
            Integer age,
            LocalDate birthDate,
            String avatarUrl,
            List<TestWithAnswersDto> tests,
            List<EvaluationTestSummaryDto> evaluationTests
    ) {}

    public record PatientTestAnswersDto(
            Long testId,
            String testCode,
            String testTitle,
            List<AnswerInfoDto> answers
    ) {}

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
            String services,
            String offices,
            Instant updatedAt,
            Boolean approved,
            String rejectionReason
    ) {}

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
            String sessionPrices,
            String services,
            String offices
    ) {}

    public record UpdateIsFullRequest(Boolean isFull) {}

    public record UpdatePatientStatusRequest(String status) {}

    public record MessageResponse(String message) {}

    public record UpdateIsFullResponse(String message, Boolean isFull) {}

    public record UpdatePatientStatusResponse(String message, String status) {}

    public record ReferralUrlResponse(String referralCode, String fullUrl) {}

    // --- Patient detail view DTOs ---

    public record PatientAppointmentDto(
            Long id,
            Instant startTime,
            Instant endTime,
            String status,
            BigDecimal price,
            String paymentStatus,
            String notes,
            String service,
            String modality
    ) {}

    public record PatientMoodEntryDto(
            Long id,
            LocalDate entryDate,
            Integer moodRating,
            String emotions,
            String activities,
            String notes,
            Instant createdAt
    ) {}

    public record PatientTaskDto(
            Long id,
            String title,
            String description,
            String createdAt,
            String dueDate,
            String completedAt,
            String createdBy
    ) {}
}
