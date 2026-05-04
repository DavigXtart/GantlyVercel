package com.alvaro.psicoapp.dto;

import java.time.Instant;

public final class TaskDtos {

    private TaskDtos() {}

    public record CreateTaskRequest(Long userId, Long psychologistId, String title, String description, String dueDate) {}

    public record TaskFileDto(
            Long id,
            String filePath,
            String originalName,
            String contentType,
            Long fileSize,
            String uploadedAt,
            Long uploaderId,
            String uploaderName
    ) {}

    public record UploadFileResponse(Long id, String filePath, String originalName) {}

    public record TaskDetailDto(
            Long id,
            String title,
            String description,
            String createdBy,
            String createdAt,
            String dueDate,
            String completedAt,
            Long userId,
            String userName,
            Long psychologistId,
            String psychologistName
    ) {}

    public record CompleteTaskResponse(String message, String completedAt) {}

    public record ReopenTaskResponse(String message) {}

    public record TaskCommentDto(
            Long id,
            String content,
            String createdAt,
            Long userId,
            String userName,
            String userEmail
    ) {}

    public record AddCommentRequest(String content) {}
}
