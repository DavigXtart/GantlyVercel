package com.alvaro.psicoapp.dto;

import java.time.Instant;
import java.time.LocalDate;

public final class UserProfileDtos {

    private UserProfileDtos() {}

    public record UserProfileDto(
            Long id,
            String name,
            String email,
            String role,
            String avatarUrl,
            Boolean darkMode,
            String gender,
            Integer age,
            LocalDate birthDate,
            Instant createdAt,
            Long companyId
    ) {}

    public record MyPsychologistResponse(String status, PsychologistSummary psychologist) {}

    public record PsychologistSummary(Long id, String name, String email, String avatarUrl) {}

    public record SelectPsychologistRequest(Long psychologistId) {}

    public record SelectPsychologistResponse(Boolean success, String message) {}

    public record UseReferralCodeRequest(String referralCode) {}

    public record UseReferralCodeResponse(Boolean success, String message) {}

    public record PsychologistProfileDetailDto(
            Long id,
            String name,
            String email,
            String avatarUrl,
            String gender,
            Integer age,
            String bio,
            String education,
            String certifications,
            String interests,
            String specializations,
            String experience,
            String languages,
            String linkedinUrl,
            String website,
            Instant updatedAt
    ) {}

    public record UpdateProfileRequest(String name, Boolean darkMode, String gender, Integer age, LocalDate birthDate) {}

    public record AvatarResponse(String avatarUrl) {}
}
