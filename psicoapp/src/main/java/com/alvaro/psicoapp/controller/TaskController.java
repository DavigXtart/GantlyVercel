package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.TaskEntity;
import com.alvaro.psicoapp.domain.TaskFileEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.TaskFileRepository;
import com.alvaro.psicoapp.repository.TaskRepository;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.security.Principal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskRepository taskRepository;
    private final TaskFileRepository taskFileRepository;
    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;

    public TaskController(TaskRepository taskRepository, TaskFileRepository taskFileRepository, UserRepository userRepository, UserPsychologistRepository userPsychologistRepository) {
        this.taskRepository = taskRepository;
        this.taskFileRepository = taskFileRepository;
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

        UserEntity user = userRepository.findById(userId).orElseThrow();
        UserEntity psych = userRepository.findById(psychologistId).orElseThrow();
        TaskEntity t = new TaskEntity();
        t.setUser(user);
        t.setPsychologist(psych);
        t.setTitle(title);
        t.setDescription(description);
        t.setCreatedBy("PSYCHOLOGIST".equals(actor.getRole()) ? "PSYCHOLOGIST" : "USER");
        t.setCreatedAt(Instant.now());
        return ResponseEntity.ok(taskRepository.save(t));
    }

    @PostMapping("/{taskId}/files")
    @Transactional
    public ResponseEntity<Map<String, Object>> uploadTaskFile(Principal principal, @PathVariable Long taskId, @RequestParam("file") MultipartFile file) throws IOException {
        var actor = userRepository.findByEmail(principal.getName()).orElseThrow();
        var task = taskRepository.findById(taskId).orElseThrow();
        if (file.isEmpty()) return ResponseEntity.badRequest().build();
        File dir = new File("uploads/tasks");
        if (!dir.exists()) dir.mkdirs();
        String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
        String name = UUID.randomUUID() + (ext != null ? ("." + ext) : "");
        File dest = new File(dir, name);
        file.transferTo(dest);

        TaskFileEntity tf = new TaskFileEntity();
        tf.setTask(task);
        tf.setUploader(actor);
        tf.setFilePath("/uploads/tasks/" + name);
        tf.setOriginalName(file.getOriginalFilename());
        tf.setContentType(file.getContentType());
        tf.setFileSize(file.getSize());
        taskFileRepository.save(tf);

        return ResponseEntity.ok(Map.of(
                "id", tf.getId(),
                "filePath", tf.getFilePath(),
                "originalName", tf.getOriginalName()
        ));
    }
}


