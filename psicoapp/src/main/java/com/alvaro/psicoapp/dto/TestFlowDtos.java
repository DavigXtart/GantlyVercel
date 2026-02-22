package com.alvaro.psicoapp.dto;

import java.util.List;

public final class TestFlowDtos {
    private TestFlowDtos() {}

    public record SubmitItem(Long questionId, Long answerId, Double numericValue, String textValue) {}
    public record SubmitRequest(Long testId, List<SubmitItem> answers) {}
}
