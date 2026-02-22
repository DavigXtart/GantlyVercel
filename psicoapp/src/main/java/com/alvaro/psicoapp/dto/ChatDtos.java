package com.alvaro.psicoapp.dto;

public final class ChatDtos {
    private ChatDtos() {}

    public record MessageDto(Long id, String sender, String content, String createdAt) {}
}
