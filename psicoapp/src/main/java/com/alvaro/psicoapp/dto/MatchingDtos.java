package com.alvaro.psicoapp.dto;

import java.util.List;

/**
 * DTOs para el módulo de matching.
 */
public final class MatchingDtos {
    private MatchingDtos() {}

    public record AnswerDto(Long id, String text, Integer value, Integer position) {}
    public record QuestionDto(Long id, String text, String type, Integer position, List<AnswerDto> answers) {}
    public record MatchingTestResponse(Long id, String code, String title, String description, List<QuestionDto> questions) {}

    public record MatchingAnswerItem(Long questionId, Long answerId, Double numericValue, String textValue) {}
    public record SubmitMatchingRequest(List<MatchingAnswerItem> answers) {}

    public record MatchingPsychologistDto(Long id, String name, String email, String avatarUrl, String gender, Integer age,
                                          double affinityScore, int matchPercentage, Double averageRating, long totalRatings) {}
    public record MatchingPsychologistsResponse(List<MatchingPsychologistDto> psychologists) {}

    public record MatchingMessageResponse(boolean success, String message) {}
    public record MatchingErrorResponse(String error) {}
}
