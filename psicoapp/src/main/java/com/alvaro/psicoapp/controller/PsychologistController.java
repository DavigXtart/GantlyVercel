package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.dto.PsychologistDtos;
import com.alvaro.psicoapp.service.CurrentUserService;
import com.alvaro.psicoapp.service.PsychologistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/psych")
@Tag(name = "Psicólogo", description = "APIs para gestión de pacientes, perfil y operaciones del psicólogo. Requiere rol PSYCHOLOGIST")
public class PsychologistController {
    private final CurrentUserService currentUserService;
    private final PsychologistService psychologistService;

    public PsychologistController(CurrentUserService currentUserService, PsychologistService psychologistService) {
        this.currentUserService = currentUserService;
        this.psychologistService = psychologistService;
    }

    @GetMapping("/patients")
    @Operation(summary = "Listar mis pacientes", description = "Obtiene la lista de pacientes asignados al psicólogo autenticado")
    @ApiResponse(responseCode = "200", description = "Lista de pacientes obtenida exitosamente")
    public ResponseEntity<List<PsychologistDtos.PatientSummaryDto>> myPatients(Principal principal) {
        return ResponseEntity.ok(psychologistService.getPatients(currentUserService.getCurrentUser(principal)));
    }

    @GetMapping("/patients/{patientId}")
    @Operation(summary = "Obtener detalles de paciente", description = "Obtiene información detallada de un paciente específico")
    @ApiResponse(responseCode = "200", description = "Detalles del paciente obtenidos exitosamente")
    public ResponseEntity<PsychologistDtos.PatientDetailDto> getPatientDetails(Principal principal, @PathVariable Long patientId) {
        return ResponseEntity.ok(psychologistService.getPatientDetails(currentUserService.getCurrentUser(principal), patientId));
    }

    @GetMapping("/patients/{patientId}/tests/{testId}/answers")
    @Operation(summary = "Obtener respuestas de paciente a un test", description = "Obtiene las respuestas de un paciente a un test específico")
    @ApiResponse(responseCode = "200", description = "Respuestas obtenidas exitosamente")
    public ResponseEntity<PsychologistDtos.PatientTestAnswersDto> getPatientTestAnswers(
            Principal principal, @PathVariable Long patientId, @PathVariable Long testId) {
        return ResponseEntity.ok(psychologistService.getPatientTestAnswers(currentUserService.getCurrentUser(principal), patientId, testId));
    }

    @GetMapping("/profile")
    @Operation(summary = "Obtener mi perfil", description = "Obtiene el perfil del psicólogo autenticado")
    @ApiResponse(responseCode = "200", description = "Perfil obtenido exitosamente")
    public ResponseEntity<PsychologistDtos.PsychologistProfileDto> getMyProfile(Principal principal) {
        return ResponseEntity.ok(psychologistService.getProfile(currentUserService.getCurrentUser(principal)));
    }

    @PutMapping("/profile")
    @Operation(summary = "Actualizar mi perfil", description = "Actualiza el perfil del psicólogo autenticado")
    @ApiResponse(responseCode = "200", description = "Perfil actualizado exitosamente")
    public ResponseEntity<PsychologistDtos.MessageResponse> updateProfile(Principal principal, @RequestBody PsychologistDtos.PsychologistProfileUpdateRequest req) {
        return ResponseEntity.ok(psychologistService.updateProfile(currentUserService.getCurrentUser(principal), req));
    }

    @PutMapping("/is-full")
    @Operation(summary = "Actualizar disponibilidad", description = "Actualiza el estado de disponibilidad del psicólogo (si está completo o no)")
    @ApiResponse(responseCode = "200", description = "Disponibilidad actualizada exitosamente")
    public ResponseEntity<PsychologistDtos.UpdateIsFullResponse> updateIsFull(Principal principal, @RequestBody PsychologistDtos.UpdateIsFullRequest req) {
        return ResponseEntity.ok(psychologistService.updateIsFull(currentUserService.getCurrentUser(principal), req));
    }

    @PutMapping("/patients/{patientId}/status")
    @Operation(summary = "Actualizar estado de paciente", description = "Actualiza el estado de un paciente (activo, inactivo, etc.)")
    @ApiResponse(responseCode = "200", description = "Estado actualizado exitosamente")
    public ResponseEntity<PsychologistDtos.UpdatePatientStatusResponse> updatePatientStatus(
            Principal principal, @PathVariable Long patientId, @RequestBody PsychologistDtos.UpdatePatientStatusRequest req) {
        return ResponseEntity.ok(psychologistService.updatePatientStatus(currentUserService.getCurrentUser(principal), patientId, req));
    }

    @GetMapping("/referral-url")
    @Operation(summary = "Obtener URL de referencia", description = "Obtiene la URL de referencia única del psicólogo para compartir con pacientes")
    @ApiResponse(responseCode = "200", description = "URL de referencia obtenida exitosamente")
    public ResponseEntity<PsychologistDtos.ReferralUrlResponse> getReferralUrl(Principal principal) {
        return ResponseEntity.ok(psychologistService.getReferralUrl(currentUserService.getCurrentUser(principal)));
    }
}
