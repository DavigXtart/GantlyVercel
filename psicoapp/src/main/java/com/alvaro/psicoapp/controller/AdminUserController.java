package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.AdminDtos;
import com.alvaro.psicoapp.service.AdminPsychologistService;
import com.alvaro.psicoapp.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@Tag(name = "Administración de Usuarios", description = "APIs para gestión de usuarios y asignación de psicólogos. Requiere rol ADMIN")
public class AdminUserController {
    private final AdminUserService adminUserService;
    private final AdminPsychologistService adminPsychologistService;

    public AdminUserController(AdminUserService adminUserService, AdminPsychologistService adminPsychologistService) {
        this.adminUserService = adminUserService;
        this.adminPsychologistService = adminPsychologistService;
    }

    @PostMapping("/role")
    @Transactional
    @Operation(summary = "Establecer rol de usuario", description = "Cambia el rol de un usuario (USER, PSYCHOLOGIST, ADMIN)")
    @ApiResponse(responseCode = "200", description = "Rol establecido exitosamente")
    public ResponseEntity<Void> setRole(@RequestBody AdminDtos.SetRoleRequest req) {
        adminUserService.setRole(req);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/psychologists")
    public ResponseEntity<List<UserEntity>> listPsychologists() {
        return ResponseEntity.ok(adminUserService.listPsychologists());
    }

    @PostMapping("/assign")
    @Transactional
    @Operation(summary = "Asignar psicólogo a paciente", description = "Asigna un psicólogo a un paciente")
    @ApiResponse(responseCode = "200", description = "Psicólogo asignado exitosamente")
    public ResponseEntity<AdminDtos.AssignPsychologistResponse> assignPsychologist(@RequestBody AdminDtos.AssignPsychologistRequest req) {
        return ResponseEntity.ok(adminUserService.assignPsychologist(req));
    }

    @DeleteMapping("/assign/{userId}")
    @Transactional
    @Operation(summary = "Desasignar psicólogo", description = "Desasigna el psicólogo de un paciente")
    @ApiResponse(responseCode = "200", description = "Psicólogo desasignado exitosamente")
    public ResponseEntity<AdminDtos.UnassignPsychologistResponse> unassignPsychologist(@PathVariable Long userId) {
        return ResponseEntity.ok(adminUserService.unassignPsychologist(userId));
    }

    @GetMapping("/psychologists/{psychologistId}/summary")
    @Operation(summary = "Obtener resumen de psicólogo", description = "Obtiene un resumen administrativo de un psicólogo")
    @ApiResponse(responseCode = "200", description = "Resumen obtenido exitosamente")
    public ResponseEntity<AdminDtos.PsychologistAdminSummaryDto> getPsychologistSummary(@PathVariable Long psychologistId) {
        return ResponseEntity.ok(adminPsychologistService.getPsychologistSummary(psychologistId));
    }
}


