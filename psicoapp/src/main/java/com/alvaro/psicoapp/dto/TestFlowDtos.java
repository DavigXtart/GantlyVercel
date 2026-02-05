package com.alvaro.psicoapp.dto;

import java.util.List;

/**
 * DTOs para el flujo de envío de respuestas de tests.
 */
public final class TestFlowDtos {
    private TestFlowDtos() {}

    public record SubmitItem(Long questionId, Long answerId, Double numericValue, String textValue) {}
    public record SubmitRequest(Long testId, List<SubmitItem> answers) {}
}

