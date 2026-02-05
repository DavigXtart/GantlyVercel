package com.alvaro.psicoapp.dto;

/**
 * DTOs para el módulo de chat.
 */
public final class ChatDtos {
    private ChatDtos() {}

    public record MessageDto(Long id, String sender, String content, String createdAt) {}
}
