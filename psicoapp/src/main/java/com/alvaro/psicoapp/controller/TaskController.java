package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.TaskEntity;
import com.alvaro.psicoapp.dto.TaskDtos;
import com.alvaro.psicoapp.service.CurrentUserService;
import com.alvaro.psicoapp.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@Tag(name = "Tareas", description = "APIs para gestión de tareas asignadas por psicólogos a pacientes")
public class TaskController {
    private final CurrentUserService currentUserService;
    private final TaskService taskService;

    public TaskController(CurrentUserService currentUserService, TaskService taskService) {
        this.currentUserService = currentUserService;
        this.taskService = taskService;
    }

    @GetMapping
    @Operation(summary = "Obtener mis tareas", description = "Obtiene todas las tareas asignadas al usuario autenticado")
    @ApiResponse(responseCode = "200", description = "Tareas obtenidas exitosamente")
    public ResponseEntity<List<TaskEntity>> myTasks(Principal principal) {
        return ResponseEntity.ok(taskService.myTasks(currentUserService.getCurrentUser(principal)));
    }

    @PostMapping
    @Transactional
    @Operation(summary = "Crear tarea", description = "Crea una nueva tarea (solo psicólogos)")
    @ApiResponse(responseCode = "200", description = "Tarea creada exitosamente")
    public ResponseEntity<TaskEntity> createTask(Principal principal, @RequestBody TaskDtos.CreateTaskRequest req) {
        return ResponseEntity.ok(taskService.createTask(currentUserService.getCurrentUser(principal), req));
    }

    @GetMapping("/{taskId}/files")
    @Operation(summary = "Obtener archivos de tarea", description = "Obtiene todos los archivos asociados a una tarea")
    @ApiResponse(responseCode = "200", description = "Archivos obtenidos exitosamente")
    public ResponseEntity<List<TaskDtos.TaskFileDto>> getTaskFiles(Principal principal, @PathVariable Long taskId) {
        return ResponseEntity.ok(taskService.getTaskFiles(currentUserService.getCurrentUser(principal), taskId));
    }

    @PostMapping("/{taskId}/files")
    @Transactional
    @Operation(summary = "Subir archivo a tarea", description = "Sube un archivo asociado a una tarea")
    @ApiResponse(responseCode = "200", description = "Archivo subido exitosamente")
    public ResponseEntity<TaskDtos.UploadFileResponse> uploadTaskFile(Principal principal, @PathVariable Long taskId, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(taskService.uploadTaskFile(currentUserService.getCurrentUser(principal), taskId, file));
    }

    @GetMapping("/{taskId}")
    @Operation(summary = "Obtener detalles de tarea", description = "Obtiene los detalles completos de una tarea específica")
    @ApiResponse(responseCode = "200", description = "Detalles de tarea obtenidos exitosamente")
    public ResponseEntity<TaskDtos.TaskDetailDto> getTask(Principal principal, @PathVariable Long taskId) {
        return ResponseEntity.ok(taskService.getTask(currentUserService.getCurrentUser(principal), taskId));
    }

    @PostMapping("/{taskId}/complete")
    @Transactional
    @Operation(summary = "Completar tarea", description = "Marca una tarea como completada")
    @ApiResponse(responseCode = "200", description = "Tarea completada exitosamente")
    public ResponseEntity<TaskDtos.CompleteTaskResponse> completeTask(Principal principal, @PathVariable Long taskId) {
        return ResponseEntity.ok(taskService.completeTask(currentUserService.getCurrentUser(principal), taskId));
    }

    @GetMapping("/{taskId}/comments")
    @Operation(summary = "Obtener comentarios de tarea", description = "Obtiene todos los comentarios de una tarea")
    @ApiResponse(responseCode = "200", description = "Comentarios obtenidos exitosamente")
    public ResponseEntity<List<TaskDtos.TaskCommentDto>> getTaskComments(Principal principal, @PathVariable Long taskId) {
        return ResponseEntity.ok(taskService.getTaskComments(currentUserService.getCurrentUser(principal), taskId));
    }

    @PostMapping("/{taskId}/comments")
    @Transactional
    @Operation(summary = "Agregar comentario a tarea", description = "Agrega un comentario a una tarea")
    @ApiResponse(responseCode = "200", description = "Comentario agregado exitosamente")
    public ResponseEntity<TaskDtos.TaskCommentDto> addTaskComment(Principal principal, @PathVariable Long taskId, @RequestBody TaskDtos.AddCommentRequest req) {
        return ResponseEntity.ok(taskService.addTaskComment(currentUserService.getCurrentUser(principal), taskId, req));
    }
}
