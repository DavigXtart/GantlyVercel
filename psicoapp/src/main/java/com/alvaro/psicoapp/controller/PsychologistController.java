package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.dto.PsychologistDtos;
import com.alvaro.psicoapp.service.CurrentUserService;
import com.alvaro.psicoapp.service.PsychologistService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/psych")
public class PsychologistController {
    private final CurrentUserService currentUserService;
    private final PsychologistService psychologistService;

    public PsychologistController(CurrentUserService currentUserService, PsychologistService psychologistService) {
        this.currentUserService = currentUserService;
        this.psychologistService = psychologistService;
    }

    @GetMapping("/patients")
    public ResponseEntity<List<PsychologistDtos.PatientSummaryDto>> myPatients(Principal principal) {
        return ResponseEntity.ok(psychologistService.getPatients(currentUserService.getCurrentUser(principal)));
    }

    @GetMapping("/patients/{patientId}")
    public ResponseEntity<PsychologistDtos.PatientDetailDto> getPatientDetails(Principal principal, @PathVariable Long patientId) {
        return ResponseEntity.ok(psychologistService.getPatientDetails(currentUserService.getCurrentUser(principal), patientId));
    }

    @GetMapping("/patients/{patientId}/tests/{testId}/answers")
    public ResponseEntity<PsychologistDtos.PatientTestAnswersDto> getPatientTestAnswers(
            Principal principal, @PathVariable Long patientId, @PathVariable Long testId) {
        return ResponseEntity.ok(psychologistService.getPatientTestAnswers(currentUserService.getCurrentUser(principal), patientId, testId));
    }

    @GetMapping("/profile")
    public ResponseEntity<PsychologistDtos.PsychologistProfileDto> getMyProfile(Principal principal) {
        return ResponseEntity.ok(psychologistService.getProfile(currentUserService.getCurrentUser(principal)));
    }

    @PutMapping("/profile")
    public ResponseEntity<PsychologistDtos.MessageResponse> updateProfile(Principal principal, @RequestBody PsychologistDtos.PsychologistProfileUpdateRequest req) {
        return ResponseEntity.ok(psychologistService.updateProfile(currentUserService.getCurrentUser(principal), req));
    }

    @PutMapping("/is-full")
    public ResponseEntity<PsychologistDtos.UpdateIsFullResponse> updateIsFull(Principal principal, @RequestBody PsychologistDtos.UpdateIsFullRequest req) {
        return ResponseEntity.ok(psychologistService.updateIsFull(currentUserService.getCurrentUser(principal), req));
    }

    @PutMapping("/patients/{patientId}/status")
    public ResponseEntity<PsychologistDtos.UpdatePatientStatusResponse> updatePatientStatus(
            Principal principal, @PathVariable Long patientId, @RequestBody PsychologistDtos.UpdatePatientStatusRequest req) {
        return ResponseEntity.ok(psychologistService.updatePatientStatus(currentUserService.getCurrentUser(principal), patientId, req));
    }
}
