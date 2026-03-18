package com.alvaro.psicoapp.dto;

import java.util.List;

public final class TestResultDtos {
    private TestResultDtos() {}

    public record SubfactorResultDto(String code, String name, double score, double maxScore, double percentage,
                                    String minLabel, String maxLabel) {}
    public record FactorResultDto(String code, String name, double score, double maxScore, double percentage,
                                 String minLabel, String maxLabel) {}
    public record TestResultItemDto(Long testId, String testTitle, List<SubfactorResultDto> subfactors, List<FactorResultDto> factors) {}
    public record MyResultsResponse(List<TestResultItemDto> results) {}

    public record TestResultsResponse(Long testId, String testTitle, List<SubfactorResultDto> subfactors, List<FactorResultDto> factors) {}

    public record SubfactorResultDetailDto(Long subfactorId, String subfactorCode, String subfactorName,
                                          double score, double maxScore, double percentage,
                                          String minLabel, String maxLabel) {}
    public record FactorResultDetailDto(Long factorId, String factorCode, String factorName,
                                       double score, double maxScore, double percentage,
                                       String minLabel, String maxLabel) {}
    public record UserTestResultsResponse(Long userId, String userEmail, Long testId, String testTitle,
                                         List<SubfactorResultDetailDto> subfactors, List<FactorResultDetailDto> factors) {}
}
