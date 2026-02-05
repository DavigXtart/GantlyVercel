package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.TaskEntity;
import com.alvaro.psicoapp.dto.TaskDtos;
import com.alvaro.psicoapp.service.CurrentUserService;
import com.alvaro.psicoapp.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {
    private final CurrentUserService currentUserService;
    private final TaskService taskService;

    public TaskController(CurrentUserService currentUserService, TaskService taskService) {
        this.currentUserService = currentUserService;
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<List<TaskEntity>> myTasks(Principal principal) {
        return ResponseEntity.ok(taskService.myTasks(currentUserService.getCurrentUser(principal)));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<TaskEntity> createTask(Principal principal, @RequestBody TaskDtos.CreateTaskRequest req) {
        return ResponseEntity.ok(taskService.createTask(currentUserService.getCurrentUser(principal), req));
    }

    @GetMapping("/{taskId}/files")
    public ResponseEntity<List<TaskDtos.TaskFileDto>> getTaskFiles(Principal principal, @PathVariable Long taskId) {
        return ResponseEntity.ok(taskService.getTaskFiles(currentUserService.getCurrentUser(principal), taskId));
    }

    @PostMapping("/{taskId}/files")
    @Transactional
    public ResponseEntity<TaskDtos.UploadFileResponse> uploadTaskFile(Principal principal, @PathVariable Long taskId, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(taskService.uploadTaskFile(currentUserService.getCurrentUser(principal), taskId, file));
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<TaskDtos.TaskDetailDto> getTask(Principal principal, @PathVariable Long taskId) {
        return ResponseEntity.ok(taskService.getTask(currentUserService.getCurrentUser(principal), taskId));
    }

    @PostMapping("/{taskId}/complete")
    @Transactional
    public ResponseEntity<TaskDtos.CompleteTaskResponse> completeTask(Principal principal, @PathVariable Long taskId) {
        return ResponseEntity.ok(taskService.completeTask(currentUserService.getCurrentUser(principal), taskId));
    }

    @GetMapping("/{taskId}/comments")
    public ResponseEntity<List<TaskDtos.TaskCommentDto>> getTaskComments(Principal principal, @PathVariable Long taskId) {
        return ResponseEntity.ok(taskService.getTaskComments(currentUserService.getCurrentUser(principal), taskId));
    }

    @PostMapping("/{taskId}/comments")
    @Transactional
    public ResponseEntity<TaskDtos.TaskCommentDto> addTaskComment(Principal principal, @PathVariable Long taskId, @RequestBody TaskDtos.AddCommentRequest req) {
        return ResponseEntity.ok(taskService.addTaskComment(currentUserService.getCurrentUser(principal), taskId, req));
    }
}
