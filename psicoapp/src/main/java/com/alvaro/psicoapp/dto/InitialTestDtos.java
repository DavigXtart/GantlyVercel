package com.alvaro.psicoapp.dto;

import java.util.List;

/**
 * DTOs para el test inicial.
 */
public final class InitialTestDtos {
    private InitialTestDtos() {}

    public record FactorDto(Long id, String code, String name) {}
    public record SubfactorDto(Long id, String code, String name, FactorDto factor) {}
    public record AnswerDto(Long id, String text, Integer value, Integer position) {}
    public record QuestionDto(Long id, String text, String type, Integer position, SubfactorDto subfactor, List<AnswerDto> answers) {}
    public record InitialTestResponse(Long id, String code, String title, String description, List<QuestionDto> questions) {}

    public record StatusResponse(boolean completed) {}

    public record SubmitItem(Long questionId, Long answerId, Double numericValue, String textValue) {}
    public record SubmitRequest(List<SubmitItem> answers) {}

    public record SubmitResponse(boolean success, String message) {}
}
