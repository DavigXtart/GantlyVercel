package com.alvaro.psicoapp.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * DTOs para tests de evaluación.
 */
public final class EvaluationTestDtos {
    private EvaluationTestDtos() {}

    public record SubmitResultRequest(String sessionId, BigDecimal score, String level, String answers) {}

    public record RecentResultDto(String testTitle, String topic, double score, String level, String completedAt) {}
    public record UserStatisticsResponse(int totalTests, double averageScore, Map<String, Long> testsByTopic, List<RecentResultDto> recentResults) {}
}
