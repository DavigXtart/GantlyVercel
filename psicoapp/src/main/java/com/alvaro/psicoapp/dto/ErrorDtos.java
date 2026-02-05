package com.alvaro.psicoapp.dto;

/**
 * DTO para respuestas de error globales.
 */
public final class ErrorDtos {
    private ErrorDtos() {}

    public record ErrorResponse(String error, String message, String timestamp) {}
}
