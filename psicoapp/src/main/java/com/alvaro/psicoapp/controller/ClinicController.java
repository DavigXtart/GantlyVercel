package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.ClinicChatMessageEntity;
import com.alvaro.psicoapp.repository.ClinicChatMessageRepository;
import com.alvaro.psicoapp.repository.CompanyRepository;
import com.alvaro.psicoapp.service.ClinicService;
import com.alvaro.psicoapp.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/clinic")
public class ClinicController {

    private static final String COMPANY_PREFIX = "company:";
    private final ClinicService clinicService;
    private final ClinicChatMessageRepository chatRepo;
    private final CompanyRepository companyRepository;
    private final NotificationService notificationService;

    public ClinicController(ClinicService clinicService,
                             ClinicChatMessageRepository chatRepo,
                             CompanyRepository companyRepository,
                             NotificationService notificationService) {
        this.clinicService = clinicService;
        this.chatRepo = chatRepo;
        this.companyRepository = companyRepository;
        this.notificationService = notificationService;
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

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(Principal principal) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        return ResponseEntity.ok(clinicService.getStats(email));
    }

    @PutMapping("/appointments/{id}/notes")
    public ResponseEntity<?> updateAppointmentNotes(Principal principal,
                                                     @PathVariable Long id,
                                                     @RequestBody ClinicService.UpdateNotesRequest req) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        return ResponseEntity.ok(clinicService.updateAppointmentNotes(email, id, req.clinicNotes()));
    }

    @GetMapping("/patients/{id}/documents")
    public ResponseEntity<?> listDocuments(Principal principal, @PathVariable Long id) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        return ResponseEntity.ok(clinicService.listDocuments(email, id));
    }

    @PostMapping("/patients/{id}/documents")
    public ResponseEntity<?> uploadDocument(Principal principal, @PathVariable Long id,
                                              @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        return ResponseEntity.ok(clinicService.uploadDocument(email, id, file));
    }

    @DeleteMapping("/documents/{docId}")
    public ResponseEntity<?> deleteDocument(Principal principal, @PathVariable Long docId) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        clinicService.deleteDocument(email, docId);
        return ResponseEntity.ok(Map.of("message", "Documento eliminado"));
    }

    @PostMapping("/appointments/{id}/payment-link")
    public ResponseEntity<?> createPaymentLink(Principal principal, @PathVariable Long id) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        return ResponseEntity.ok(clinicService.createPaymentLink(email, id));
    }

    @GetMapping("/psychologists/{id}/schedule")
    public ResponseEntity<?> getPsychologistSchedule(Principal principal, @PathVariable Long id) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        return ResponseEntity.ok(clinicService.getPsychologistSchedule(email, id));
    }

    // ---- Clinic rooms (despachos) ----

    @GetMapping("/rooms")
    public ResponseEntity<?> getRooms(Principal principal) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        return ResponseEntity.ok(clinicService.getRooms(email));
    }

    @PostMapping("/rooms")
    public ResponseEntity<?> createRoom(Principal principal,
                                         @RequestBody ClinicService.CreateRoomRequest req) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        return ResponseEntity.ok(clinicService.createRoom(email, req));
    }

    @PutMapping("/rooms/{id}")
    public ResponseEntity<?> updateRoom(Principal principal, @PathVariable Long id,
                                         @RequestBody ClinicService.UpdateRoomRequest req) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        return ResponseEntity.ok(clinicService.updateRoom(email, id, req));
    }

    @DeleteMapping("/rooms/{id}")
    public ResponseEntity<?> deleteRoom(Principal principal, @PathVariable Long id) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        clinicService.deleteRoom(email, id);
        return ResponseEntity.ok(Map.of("message", "Despacho eliminado"));
    }

    // ---- Clinic chat (Feature F) ----
    public record ChatMessageDto(Long id, String sender, String content, String createdAt) {}
    public record SendMessageRequest(String content) {}

    private Long resolveCompanyId(String email) {
        return companyRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empresa no encontrada"))
                .getId();
    }

    @GetMapping("/chat/{patientId}")
    public ResponseEntity<?> getChatMessages(Principal principal, @PathVariable Long patientId,
                                              @RequestParam(required = false) String after) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        Long companyId = resolveCompanyId(email);
        List<ClinicChatMessageEntity> messages = after != null
                ? chatRepo.findByCompanyIdAndPatientIdAndCreatedAtAfterOrderByCreatedAtAsc(
                        companyId, patientId, Instant.parse(after))
                : chatRepo.findByCompanyIdAndPatientIdOrderByCreatedAtAsc(companyId, patientId);
        return ResponseEntity.ok(messages.stream()
                .map(m -> new ChatMessageDto(m.getId(), m.getSender(), m.getContent(), m.getCreatedAt().toString()))
                .collect(Collectors.toList()));
    }

    @PostMapping("/chat/{patientId}")
    public ResponseEntity<?> sendChatMessage(Principal principal, @PathVariable Long patientId,
                                              @RequestBody SendMessageRequest req) {
        String email = getCompanyEmail(principal);
        if (email == null) return unauthorized();
        Long companyId = resolveCompanyId(email);
        ClinicChatMessageEntity msg = new ClinicChatMessageEntity();
        msg.setCompanyId(companyId);
        msg.setPatientId(patientId);
        msg.setSender("CLINIC");
        msg.setContent(req.content());
        chatRepo.save(msg);

        // Create notification for the patient
        notificationService.createNotification(
                patientId,
                "CLINIC_CHAT",
                "Mensaje de tu clinica",
                "Tu clinica te ha enviado un mensaje"
        );

        return ResponseEntity.ok(new ChatMessageDto(msg.getId(), msg.getSender(), msg.getContent(), msg.getCreatedAt().toString()));
    }

}