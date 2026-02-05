package com.alvaro.psicoapp.dto;

import java.time.Instant;

/**
 * DTOs para el módulo de tareas.
 */
public final class TaskDtos {

    private TaskDtos() {}

    /** Request para crear una tarea (dueDate como string ISO-8601 o null) */
    public record CreateTaskRequest(Long userId, Long psychologistId, String title, String description, String dueDate) {}

    /** Archivo adjunto de una tarea */
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

    /** Respuesta de subida de archivo */
    public record UploadFileResponse(Long id, String filePath, String originalName) {}

    /** Detalle de una tarea */
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

    /** Respuesta de completar tarea */
    public record CompleteTaskResponse(String message, String completedAt) {}

    /** Comentario de una tarea */
    public record TaskCommentDto(
            Long id,
            String content,
            String createdAt,
            Long userId,
            String userName,
            String userEmail
    ) {}

    /** Request para añadir comentario */
    public record AddCommentRequest(String content) {}
}
