package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.TaskEntity;
import com.alvaro.psicoapp.domain.TaskFileEntity;
import com.alvaro.psicoapp.domain.TaskCommentEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.TaskFileRepository;
import com.alvaro.psicoapp.repository.TaskRepository;
import com.alvaro.psicoapp.repository.TaskCommentRepository;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.security.Principal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {
	private static final Logger logger = LoggerFactory.getLogger(TaskController.class);
    private final TaskRepository taskRepository;
    private final TaskFileRepository taskFileRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;

    public TaskController(TaskRepository taskRepository, TaskFileRepository taskFileRepository, TaskCommentRepository taskCommentRepository, UserRepository userRepository, UserPsychologistRepository userPsychologistRepository) {
        this.taskRepository = taskRepository;
        this.taskFileRepository = taskFileRepository;
        this.taskCommentRepository = taskCommentRepository;
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
    }

    @GetMapping
    public ResponseEntity<List<TaskEntity>> myTasks(Principal principal) {
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        if ("PSYCHOLOGIST".equals(user.getRole())) {
            return ResponseEntity.ok(taskRepository.findByPsychologist_IdOrderByCreatedAtDesc(user.getId()));
        }
        return ResponseEntity.ok(taskRepository.findByUser_IdOrderByCreatedAtDesc(user.getId()));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<TaskEntity> createTask(Principal principal, @RequestBody Map<String, Object> body) {
        var actor = userRepository.findByEmail(principal.getName()).orElseThrow();
        Long userId = Long.valueOf(String.valueOf(body.get("userId"))); // destinatario user
        Long psychologistId = Long.valueOf(String.valueOf(body.get("psychologistId")));
        String title = String.valueOf(body.get("title"));
        String description = body.get("description") != null ? String.valueOf(body.get("description")) : null;
        Instant dueDate = null;
        if (body.get("dueDate") != null && !String.valueOf(body.get("dueDate")).isEmpty()) {
            try {
                dueDate = Instant.parse(String.valueOf(body.get("dueDate")));
            } catch (Exception e) {
                // Si no se puede parsear, se deja como null
            }
        }

        UserEntity user = userRepository.findById(userId).orElseThrow();
        UserEntity psych = userRepository.findById(psychologistId).orElseThrow();
        TaskEntity t = new TaskEntity();
        t.setUser(user);
        t.setPsychologist(psych);
        t.setTitle(title);
        t.setDescription(description);
        t.setDueDate(dueDate);
        t.setCreatedBy("PSYCHOLOGIST".equals(actor.getRole()) ? "PSYCHOLOGIST" : "USER");
        t.setCreatedAt(Instant.now());
        return ResponseEntity.ok(taskRepository.save(t));
    }

    @GetMapping("/{taskId}/files")
    public ResponseEntity<List<Map<String, Object>>> getTaskFiles(Principal principal, @PathVariable Long taskId) {
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        var task = taskRepository.findById(taskId).orElseThrow();
        
        // Verificar que el usuario tiene acceso a esta tarea
        boolean hasAccess = false;
        if ("PSYCHOLOGIST".equals(user.getRole())) {
            hasAccess = task.getPsychologist().getId().equals(user.getId());
        } else {
            hasAccess = task.getUser().getId().equals(user.getId());
        }
        
        if (!hasAccess) {
            return ResponseEntity.status(403).build();
        }
        
        var files = taskFileRepository.findByTask_Id(taskId);
        List<Map<String, Object>> filesData = files.stream().map(f -> {
            Map<String, Object> fileMap = new java.util.HashMap<>();
            fileMap.put("id", f.getId());
            fileMap.put("filePath", f.getFilePath());
            fileMap.put("originalName", f.getOriginalName());
            fileMap.put("contentType", f.getContentType() != null ? f.getContentType() : "");
            fileMap.put("fileSize", f.getFileSize() != null ? f.getFileSize() : 0);
            fileMap.put("uploadedAt", f.getUploadedAt() != null ? f.getUploadedAt().toString() : "");
            fileMap.put("uploaderId", f.getUploader().getId());
            fileMap.put("uploaderName", f.getUploader().getName());
            return fileMap;
        }).collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(filesData);
    }

    @PostMapping("/{taskId}/files")
    @Transactional
    public ResponseEntity<Map<String, Object>> uploadTaskFile(Principal principal, @PathVariable Long taskId, @RequestParam("file") MultipartFile file) {
        var actor = userRepository.findByEmail(principal.getName()).orElseThrow();
        var task = taskRepository.findById(taskId).orElseThrow();
        
        // Verificar que el usuario tiene acceso a esta tarea
        boolean hasAccess = false;
        if ("PSYCHOLOGIST".equals(actor.getRole())) {
            hasAccess = task.getPsychologist().getId().equals(actor.getId());
        } else {
            hasAccess = task.getUser().getId().equals(actor.getId());
        }
        
        if (!hasAccess) {
            return ResponseEntity.status(403).build();
        }
        
        if (file.isEmpty()) {
            Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", "El archivo está vacío");
            return ResponseEntity.badRequest().body(error);
        }
        
        try {
            // Crear directorio si no existe
            File uploadsDir = new File("uploads");
            if (!uploadsDir.exists()) {
                boolean created = uploadsDir.mkdirs();
                if (!created) {
                    Map<String, Object> error = new java.util.HashMap<>();
                    error.put("error", "No se pudo crear el directorio uploads");
                    error.put("path", uploadsDir.getAbsolutePath());
                    return ResponseEntity.status(500).body(error);
                }
            }
            
            File dir = new File(uploadsDir, "tasks");
            if (!dir.exists()) {
                boolean created = dir.mkdirs();
                if (!created || !dir.exists()) {
                    Map<String, Object> error = new java.util.HashMap<>();
                    error.put("error", "No se pudo crear el directorio uploads/tasks");
                    error.put("path", dir.getAbsolutePath());
                    return ResponseEntity.status(500).body(error);
                }
            }
            
            // Verificar que el directorio es accesible
            if (!dir.canWrite()) {
                Map<String, Object> error = new java.util.HashMap<>();
                error.put("error", "No se tienen permisos de escritura en el directorio");
                error.put("path", dir.getAbsolutePath());
                return ResponseEntity.status(500).body(error);
            }
            
            // Generar nombre único para el archivo
            String originalFilename = file.getOriginalFilename();
            String ext = StringUtils.getFilenameExtension(originalFilename);
            String name = UUID.randomUUID() + (ext != null ? ("." + ext) : "");
            File dest = new File(dir, name);
            
            // Guardar archivo en disco (usar Files.copy para mayor compatibilidad)
            File absoluteDest = dest.getAbsoluteFile();
            try {
                // Asegurarse de que el directorio padre existe
                File parentDir = absoluteDest.getParentFile();
                if (parentDir != null && !parentDir.exists()) {
                    boolean created = parentDir.mkdirs();
                    if (!created && !parentDir.exists()) {
                        Map<String, Object> error = new java.util.HashMap<>();
                        error.put("error", "No se pudo crear el directorio padre");
                        error.put("path", parentDir.getAbsolutePath());
                        return ResponseEntity.status(500).body(error);
                    }
                }
                
                // Usar Files.copy en lugar de transferTo para mayor compatibilidad
                Files.copy(file.getInputStream(), absoluteDest.toPath(), StandardCopyOption.REPLACE_EXISTING);
                
                // Verificar que el archivo se creó correctamente
                if (!absoluteDest.exists() || !absoluteDest.canRead()) {
                    Map<String, Object> error = new java.util.HashMap<>();
                    error.put("error", "El archivo no se guardó correctamente");
                    error.put("path", absoluteDest.getAbsolutePath());
                    return ResponseEntity.status(500).body(error);
                }
            } catch (IOException ioException) {
                logger.error("Error al escribir archivo", ioException);
                Map<String, Object> error = new java.util.HashMap<>();
                error.put("error", "Error al escribir el archivo: " + ioException.getMessage());
                error.put("path", absoluteDest.getAbsolutePath());
                error.put("details", "IOException");
                error.put("exception", ioException.getClass().getSimpleName());
                if (ioException.getCause() != null) {
                    error.put("cause", ioException.getCause().getMessage());
                }
                return ResponseEntity.status(500).body(error);
            }

            // Crear entidad y guardar en base de datos
            TaskFileEntity tf = new TaskFileEntity();
            tf.setTask(task);
            tf.setUploader(actor);
            tf.setFilePath("/uploads/tasks/" + name);
            tf.setOriginalName(originalFilename != null ? originalFilename : "archivo");
            tf.setContentType(file.getContentType());
            tf.setFileSize(file.getSize());
            tf.setUploadedAt(Instant.now());
            
            TaskFileEntity saved = taskFileRepository.save(tf);

            Map<String, Object> response = new java.util.HashMap<>();
            response.put("id", saved.getId());
            response.put("filePath", saved.getFilePath());
            response.put("originalName", saved.getOriginalName());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error al subir archivo de tarea", e);
            Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", "Error inesperado: " + e.getMessage());
            error.put("details", e.getClass().getSimpleName());
            if (e.getCause() != null) {
                error.put("cause", e.getCause().getMessage());
            }
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<Map<String, Object>> getTask(Principal principal, @PathVariable Long taskId) {
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        var task = taskRepository.findById(taskId).orElseThrow();
        
        // Verificar que el usuario tiene acceso a esta tarea
        boolean hasAccess = false;
        if ("PSYCHOLOGIST".equals(user.getRole())) {
            hasAccess = task.getPsychologist().getId().equals(user.getId());
        } else {
            hasAccess = task.getUser().getId().equals(user.getId());
        }
        
        if (!hasAccess) {
            return ResponseEntity.status(403).build();
        }
        
        Map<String, Object> taskData = new java.util.HashMap<>();
        taskData.put("id", task.getId());
        taskData.put("title", task.getTitle());
        taskData.put("description", task.getDescription());
        taskData.put("createdBy", task.getCreatedBy());
        taskData.put("createdAt", task.getCreatedAt() != null ? task.getCreatedAt().toString() : null);
        taskData.put("dueDate", task.getDueDate() != null ? task.getDueDate().toString() : null);
        taskData.put("userId", task.getUser().getId());
        taskData.put("userName", task.getUser().getName());
        taskData.put("psychologistId", task.getPsychologist().getId());
        taskData.put("psychologistName", task.getPsychologist().getName());
        
        return ResponseEntity.ok(taskData);
    }

    @GetMapping("/{taskId}/comments")
    public ResponseEntity<List<Map<String, Object>>> getTaskComments(Principal principal, @PathVariable Long taskId) {
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        var task = taskRepository.findById(taskId).orElseThrow();
        
        // Verificar que el usuario tiene acceso a esta tarea
        boolean hasAccess = false;
        if ("PSYCHOLOGIST".equals(user.getRole())) {
            hasAccess = task.getPsychologist().getId().equals(user.getId());
        } else {
            hasAccess = task.getUser().getId().equals(user.getId());
        }
        
        if (!hasAccess) {
            return ResponseEntity.status(403).build();
        }
        
        var comments = taskCommentRepository.findByTask_IdOrderByCreatedAtAsc(taskId);
        List<Map<String, Object>> commentsData = comments.stream().map(c -> {
            Map<String, Object> commentMap = new java.util.HashMap<>();
            commentMap.put("id", c.getId());
            commentMap.put("content", c.getContent());
            commentMap.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().toString() : null);
            commentMap.put("userId", c.getUser().getId());
            commentMap.put("userName", c.getUser().getName());
            commentMap.put("userEmail", c.getUser().getEmail());
            return commentMap;
        }).collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(commentsData);
    }

    @PostMapping("/{taskId}/comments")
    @Transactional
    public ResponseEntity<Map<String, Object>> addTaskComment(Principal principal, @PathVariable Long taskId, @RequestBody Map<String, Object> body) {
        var actor = userRepository.findByEmail(principal.getName()).orElseThrow();
        var task = taskRepository.findById(taskId).orElseThrow();
        
        // Verificar que el usuario tiene acceso a esta tarea
        boolean hasAccess = false;
        if ("PSYCHOLOGIST".equals(actor.getRole())) {
            hasAccess = task.getPsychologist().getId().equals(actor.getId());
        } else {
            hasAccess = task.getUser().getId().equals(actor.getId());
        }
        
        if (!hasAccess) {
            return ResponseEntity.status(403).build();
        }
        
        String content = String.valueOf(body.get("content"));
        if (content == null || content.trim().isEmpty()) {
            Map<String, Object> error = new java.util.HashMap<>();
            error.put("error", "El contenido del comentario no puede estar vacío");
            return ResponseEntity.badRequest().body(error);
        }
        
        TaskCommentEntity comment = new TaskCommentEntity();
        comment.setTask(task);
        comment.setUser(actor);
        comment.setContent(content.trim());
        TaskCommentEntity saved = taskCommentRepository.save(comment);
        
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("id", saved.getId());
        response.put("content", saved.getContent());
        response.put("createdAt", saved.getCreatedAt().toString());
        response.put("userId", saved.getUser().getId());
        response.put("userName", saved.getUser().getName());
        response.put("userEmail", saved.getUser().getEmail());
        
        return ResponseEntity.ok(response);
    }
}


