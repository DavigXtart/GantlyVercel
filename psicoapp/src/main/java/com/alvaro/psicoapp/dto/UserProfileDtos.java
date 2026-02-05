package com.alvaro.psicoapp.dto;

import java.time.Instant;

/**
 * DTOs para perfil de usuario.
 */
public final class UserProfileDtos {

    private UserProfileDtos() {}

    /** Perfil básico del usuario autenticado */
    public record UserProfileDto(
            Long id,
            String name,
            String email,
            String role,
            String avatarUrl,
            Boolean darkMode,
            String gender,
            Integer age,
            Instant createdAt
    ) {}

    /** Estado del psicólogo asignado */
    public record MyPsychologistResponse(String status, PsychologistSummary psychologist) {}

    /** Resumen del psicólogo */
    public record PsychologistSummary(Long id, String name, String email, String avatarUrl) {}

    /** Request para seleccionar psicólogo */
    public record SelectPsychologistRequest(Long psychologistId) {}

    /** Respuesta de selección exitosa */
    public record SelectPsychologistResponse(Boolean success, String message) {}

    /** Perfil completo del psicólogo (para ver detalles) */
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

    /** Request para actualizar perfil de usuario */
    public record UpdateProfileRequest(String name, Boolean darkMode, String gender, Integer age) {}

    /** Respuesta de subida de avatar */
    public record AvatarResponse(String avatarUrl) {}
}
