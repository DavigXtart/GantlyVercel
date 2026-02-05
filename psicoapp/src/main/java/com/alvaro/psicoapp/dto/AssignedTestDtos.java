package com.alvaro.psicoapp.dto;

import java.time.Instant;

/**
 * DTOs para tests asignados.
 */
public final class AssignedTestDtos {

    private AssignedTestDtos() {}

    /** Test asignado (lista) */
    public record AssignedTestDto(
            Long id,
            Long userId,
            String userName,
            String userEmail,
            String userAvatarUrl,
            Long testId,
            String testTitle,
            String testCode,
            TestSummary test,
            Long psychologistId,
            String psychologistName,
            String assignedAt,
            String completedAt
    ) {}

    /** Resumen de test para compatibilidad frontend */
    public record TestSummary(Long id, String title, String code) {}

    /** Request para asignar test */
    public record AssignTestRequest(Long userId, Long testId) {}

    /** Respuesta de asignar o completar test (completedAt puede ser null) */
    public record AssignedTestResponse(
            Long id,
            Long userId,
            Long testId,
            Long psychologistId,
            Object assignedAt,
            Object completedAt
    ) {}
}
