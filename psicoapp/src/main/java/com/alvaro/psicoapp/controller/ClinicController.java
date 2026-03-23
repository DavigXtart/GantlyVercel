package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.service.ClinicService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/clinic")
public class ClinicController {

    private static final String COMPANY_PREFIX = "company:";
    private final ClinicService clinicService;

    public ClinicController(ClinicService clinicService) {
        this.clinicService = clinicService;
    }

    private String getCompanyEmail(Principal principal) {
        if (principal == null) return null;
        String subject = principal.getName();
        if (subject != null && subject.startsWith(COMPANY_PREFIX)) {
            return subject.substring(COMPANY_PREFIX.length());
        }
        return null;
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(Principal principal) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        return ResponseEntity.ok(clinicService.getMe(email));
    }

    @GetMapping("/psychologists")
    public ResponseEntity<?> getPsychologists(Principal principal) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        return ResponseEntity.ok(clinicService.getPsychologists(email));
    }

    @GetMapping("/agenda")
    public ResponseEntity<?> getAgenda(Principal principal,
                                        @RequestParam String from,
                                        @RequestParam String to) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        return ResponseEntity.ok(clinicService.getAgenda(email, Instant.parse(from), Instant.parse(to)));
    }

    @PostMapping("/appointments")
    public ResponseEntity<?> createAppointment(Principal principal,
                                                @RequestBody ClinicService.CreateAppointmentRequest req) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        return ResponseEntity.ok(clinicService.createAppointment(email, req));
    }

    @PutMapping("/appointments/{id}")
    public ResponseEntity<?> updateAppointment(Principal principal,
                                                @PathVariable Long id,
                                                @RequestBody ClinicService.UpdateAppointmentRequest req) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        return ResponseEntity.ok(clinicService.updateAppointment(email, id, req));
    }

    @DeleteMapping("/appointments/{id}")
    public ResponseEntity<?> cancelAppointment(Principal principal, @PathVariable Long id) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        clinicService.cancelAppointment(email, id);
        return ResponseEntity.ok(Map.of("message", "Cita cancelada"));
    }

    @GetMapping("/patients")
    public ResponseEntity<?> getPatients(Principal principal,
                                          @RequestParam(required = false) String search) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        return ResponseEntity.ok(clinicService.getPatients(email, search));
    }

    @GetMapping("/patients/{id}")
    public ResponseEntity<?> getPatient(Principal principal, @PathVariable Long id) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        return ResponseEntity.ok(clinicService.getPatient(email, id));
    }

    @PutMapping("/patients/{id}")
    public ResponseEntity<?> updatePatient(Principal principal,
                                            @PathVariable Long id,
                                            @RequestBody ClinicService.UpdatePatientRequest req) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        return ResponseEntity.ok(clinicService.updatePatient(email, id, req));
    }

    @GetMapping("/billing")
    public ResponseEntity<?> getBilling(Principal principal,
                                         @RequestParam(required = false) String from,
                                         @RequestParam(required = false) String to,
                                         @RequestParam(required = false) Long psychologistId) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        Instant fromI = from != null ? Instant.parse(from) : Instant.now().minusSeconds(30L * 24 * 3600);
        Instant toI = to != null ? Instant.parse(to) : Instant.now().plusSeconds(365L * 24 * 3600);
        return ResponseEntity.ok(clinicService.getBilling(email, fromI, toI, psychologistId));
    }

    @PostMapping("/invitations")
    public ResponseEntity<?> sendInvitation(Principal principal,
                                             @RequestBody ClinicService.SendInvitationRequest req) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        return ResponseEntity.ok(clinicService.sendInvitation(email, req.email()));
    }

    @GetMapping("/invitations")
    public ResponseEntity<?> listInvitations(Principal principal) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        return ResponseEntity.ok(clinicService.listInvitations(email));
    }

    @DeleteMapping("/invitations/{id}")
    public ResponseEntity<?> cancelInvitation(Principal principal, @PathVariable Long id) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        clinicService.cancelInvitation(email, id);
        return ResponseEntity.ok(Map.of("message", "Invitacion cancelada"));
    }

}