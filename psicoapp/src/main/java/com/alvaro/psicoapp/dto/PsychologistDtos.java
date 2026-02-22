package com.alvaro.psicoapp.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

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
            List<TestWithAnswersDto> tests
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
            Instant updatedAt
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
            String sessionPrices
    ) {}

    public record UpdateIsFullRequest(Boolean isFull) {}

    public record UpdatePatientStatusRequest(String status) {}

    public record MessageResponse(String message) {}

    public record UpdateIsFullResponse(String message, Boolean isFull) {}

    public record UpdatePatientStatusResponse(String message, String status) {}

    public record ReferralUrlResponse(String referralCode, String fullUrl) {}
}
