package com.alvaro.psicoapp.dto;

import java.util.List;

/**
 * DTOs para el TestController (estructura de test público).
 */
public final class TestDtos {
    private TestDtos() {}

    public record FactorDto(Long id, String code, String name) {}
    public record SubfactorDto(Long id, String code, String name, FactorDto factor) {}
    public record AnswerDto(Long id, String text, Integer value, Integer position) {}
    public record QuestionDto(Long id, String text, String type, Integer position, SubfactorDto subfactor, List<AnswerDto> answers) {}
    public record TestDetailResponse(Long id, String code, String title, String description, Boolean active, List<QuestionDto> questions) {}
}
