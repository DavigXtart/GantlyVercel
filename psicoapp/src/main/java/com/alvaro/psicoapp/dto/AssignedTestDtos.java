package com.alvaro.psicoapp.dto;

import java.time.Instant;

public final class AssignedTestDtos {

    private AssignedTestDtos() {}

    public record AssignedTestDto(
            Long id,
            Long userId,
            String userName,
            String userEmail,
            String userAvatarUrl,
            Long testId,
            String testTitle,
            String testCode,
            Long evaluationTestId,
            String evaluationTestTitle,
            String evaluationTestCode,
            TestSummary test,
            Long psychologistId,
            String psychologistName,
            String assignedAt,
            String completedAt
    ) {}

    public record TestSummary(Long id, String title, String code) {}

    public record AssignTestRequest(Long userId, Long testId, Long evaluationTestId) {}

    public record AssignedTestResponse(
            Long id,
            Long userId,
            Long testId,
            Long evaluationTestId,
            Long psychologistId,
            Object assignedAt,
            Object completedAt
    ) {}
}
