package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.TaskEntity;
import com.alvaro.psicoapp.domain.TaskFileEntity;
import com.alvaro.psicoapp.domain.TaskCommentEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.TaskDtos;
import com.alvaro.psicoapp.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TaskService {
    private static final Logger logger = LoggerFactory.getLogger(TaskService.class);
    private final TaskRepository taskRepository;
    private final TaskFileRepository taskFileRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;

    public TaskService(TaskRepository taskRepository, TaskFileRepository taskFileRepository,
                       TaskCommentRepository taskCommentRepository, UserRepository userRepository,
                       UserPsychologistRepository userPsychologistRepository) {
        this.taskRepository = taskRepository;
        this.taskFileRepository = taskFileRepository;
        this.taskCommentRepository = taskCommentRepository;
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
    }

    @Transactional(readOnly = true)
    public List<TaskEntity> myTasks(UserEntity user) {
        if (RoleConstants.PSYCHOLOGIST.equals(user.getRole())) {
            return taskRepository.findByPsychologist_IdOrderByCreatedAtDesc(user.getId());
        }
        return taskRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
    }

    @Transactional
    public TaskEntity createTask(UserEntity actor, TaskDtos.CreateTaskRequest req) {
        UserEntity user = userRepository.findById(req.userId()).orElseThrow();
        UserEntity psych = userRepository.findById(req.psychologistId()).orElseThrow();
        Instant dueDate = null;
        if (req.dueDate() != null && !req.dueDate().isBlank()) {
            try {
                dueDate = Instant.parse(req.dueDate());
            } catch (Exception ignored) {}
        }
        TaskEntity t = new TaskEntity();
        t.setUser(user);
        t.setPsychologist(psych);
        t.setTitle(req.title());
        t.setDescription(req.description());
        t.setDueDate(dueDate);
        t.setCreatedBy(RoleConstants.PSYCHOLOGIST.equals(actor.getRole()) ? RoleConstants.PSYCHOLOGIST : RoleConstants.USER);
        t.setCreatedAt(Instant.now());
        return taskRepository.save(t);
    }

    @Transactional(readOnly = true)
    public List<TaskDtos.TaskFileDto> getTaskFiles(UserEntity user, Long taskId) {
        TaskEntity task = taskRepository.findById(taskId).orElseThrow();
        requireTaskAccess(user, task);
        var files = taskFileRepository.findByTask_Id(taskId);
        return files.stream().map(f -> new TaskDtos.TaskFileDto(
                f.getId(),
                f.getFilePath(),
                f.getOriginalName(),
                f.getContentType() != null ? f.getContentType() : "",
                f.getFileSize() != null ? f.getFileSize() : 0L,
                f.getUploadedAt() != null ? f.getUploadedAt().toString() : "",
                f.getUploader().getId(),
                f.getUploader().getName()
        )).collect(Collectors.toList());
    }

    @Transactional
    public TaskDtos.UploadFileResponse uploadTaskFile(UserEntity actor, Long taskId, MultipartFile file) {
        TaskEntity task = taskRepository.findById(taskId).orElseThrow();
        requireTaskAccess(actor, task);
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo está vacío");
        }
        File uploadsDir = new File("uploads");
        if (!uploadsDir.exists() && !uploadsDir.mkdirs()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo crear el directorio uploads");
        }
        File dir = new File(uploadsDir, "tasks");
        if (!dir.exists() && !dir.mkdirs()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo crear el directorio uploads/tasks");
        }
        if (!dir.canWrite()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se tienen permisos de escritura");
        }
        String originalFilename = file.getOriginalFilename();
        String ext = StringUtils.getFilenameExtension(originalFilename);
        String name = UUID.randomUUID() + (ext != null ? ("." + ext) : "");
        File dest = new File(dir, name);
        File absoluteDest = dest.getAbsoluteFile();
        try {
            File parentDir = absoluteDest.getParentFile();
            if (parentDir != null && !parentDir.exists()) parentDir.mkdirs();
            Files.copy(file.getInputStream(), absoluteDest.toPath(), StandardCopyOption.REPLACE_EXISTING);
            if (!absoluteDest.exists() || !absoluteDest.canRead()) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "El archivo no se guardó correctamente");
            }
        } catch (IOException e) {
            logger.error("Error al escribir archivo", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al escribir el archivo: " + e.getMessage());
        }
        TaskFileEntity tf = new TaskFileEntity();
        tf.setTask(task);
        tf.setUploader(actor);
        tf.setFilePath("/uploads/tasks/" + name);
        tf.setOriginalName(originalFilename != null ? originalFilename : "archivo");
        tf.setContentType(file.getContentType());
        tf.setFileSize(file.getSize());
        tf.setUploadedAt(Instant.now());
        TaskFileEntity saved = taskFileRepository.save(tf);
        return new TaskDtos.UploadFileResponse(saved.getId(), saved.getFilePath(), saved.getOriginalName());
    }

    @Transactional(readOnly = true)
    public TaskDtos.TaskDetailDto getTask(UserEntity user, Long taskId) {
        TaskEntity task = taskRepository.findById(taskId).orElseThrow();
        requireTaskAccess(user, task);
        return new TaskDtos.TaskDetailDto(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getCreatedBy(),
                task.getCreatedAt() != null ? task.getCreatedAt().toString() : null,
                task.getDueDate() != null ? task.getDueDate().toString() : null,
                task.getCompletedAt() != null ? task.getCompletedAt().toString() : null,
                task.getUser().getId(),
                task.getUser().getName(),
                task.getPsychologist().getId(),
                task.getPsychologist().getName()
        );
    }

    @Transactional
    public TaskDtos.CompleteTaskResponse completeTask(UserEntity user, Long taskId) {
        TaskEntity task = taskRepository.findById(taskId).orElseThrow();
        if (RoleConstants.PSYCHOLOGIST.equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el paciente puede marcar la tarea como completada");
        }
        if (!task.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a esta tarea");
        }
        if (task.getCompletedAt() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La tarea ya está completada");
        }
        task.setCompletedAt(Instant.now());
        taskRepository.save(task);
        return new TaskDtos.CompleteTaskResponse("Tarea marcada como completada", task.getCompletedAt().toString());
    }

    @Transactional(readOnly = true)
    public List<TaskDtos.TaskCommentDto> getTaskComments(UserEntity user, Long taskId) {
        TaskEntity task = taskRepository.findById(taskId).orElseThrow();
        requireTaskAccess(user, task);
        var comments = taskCommentRepository.findByTask_IdOrderByCreatedAtAsc(taskId);
        return comments.stream().map(c -> new TaskDtos.TaskCommentDto(
                c.getId(),
                c.getContent(),
                c.getCreatedAt() != null ? c.getCreatedAt().toString() : null,
                c.getUser().getId(),
                c.getUser().getName(),
                c.getUser().getEmail()
        )).collect(Collectors.toList());
    }

    @Transactional
    public TaskDtos.TaskCommentDto addTaskComment(UserEntity actor, Long taskId, TaskDtos.AddCommentRequest req) {
        TaskEntity task = taskRepository.findById(taskId).orElseThrow();
        requireTaskAccess(actor, task);
        String content = req.content();
        if (content == null || content.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El contenido del comentario no puede estar vacío");
        }
        TaskCommentEntity comment = new TaskCommentEntity();
        comment.setTask(task);
        comment.setUser(actor);
        comment.setContent(content.trim());
        TaskCommentEntity saved = taskCommentRepository.save(comment);
        return new TaskDtos.TaskCommentDto(
                saved.getId(),
                saved.getContent(),
                saved.getCreatedAt().toString(),
                saved.getUser().getId(),
                saved.getUser().getName(),
                saved.getUser().getEmail()
        );
    }

    private void requireTaskAccess(UserEntity user, TaskEntity task) {
        boolean hasAccess = RoleConstants.PSYCHOLOGIST.equals(user.getRole())
                ? task.getPsychologist().getId().equals(user.getId())
                : task.getUser().getId().equals(user.getId());
        if (!hasAccess) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }
}
