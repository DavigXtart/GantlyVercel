package com.alvaro.psicoapp.dto;

public final class ErrorDtos {
    private ErrorDtos() {}

    public record ErrorResponse(String error, String message, String timestamp) {}
}
