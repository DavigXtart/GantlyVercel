package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.ClinicChatMessageEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.ClinicChatMessageRepository;
import com.alvaro.psicoapp.service.CurrentUserService;
import com.alvaro.psicoapp.service.NotificationService;
import com.alvaro.psicoapp.repository.CompanyRepository;
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
@RequestMapping("/api/patient/clinic-chat")
public class PatientClinicChatController {

    private final CurrentUserService currentUserService;
    private final ClinicChatMessageRepository chatRepo;
    private final CompanyRepository companyRepository;
    private final NotificationService notificationService;

    public PatientClinicChatController(CurrentUserService currentUserService,
                                        ClinicChatMessageRepository chatRepo,
                                        CompanyRepository companyRepository,
                                        NotificationService notificationService) {
        this.currentUserService = currentUserService;
        this.chatRepo = chatRepo;
        this.companyRepository = companyRepository;
        this.notificationService = notificationService;
    }

    public record ChatMessageDto(Long id, String sender, String content, String createdAt) {}
    public record SendMessageRequest(String content) {}

    @GetMapping
    public ResponseEntity<?> getChatMessages(Principal principal,
                                              @RequestParam(required = false) String after) {
        UserEntity user = currentUserService.getCurrentUser(principal);
        Long companyId = user.getCompanyId();
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No perteneces a ninguna clínica");
        }

        List<ClinicChatMessageEntity> messages = after != null
                ? chatRepo.findByCompanyIdAndPatientIdAndCreatedAtAfterOrderByCreatedAtAsc(
                        companyId, user.getId(), Instant.parse(after))
                : chatRepo.findByCompanyIdAndPatientIdOrderByCreatedAtAsc(companyId, user.getId());

        return ResponseEntity.ok(messages.stream()
                .map(m -> new ChatMessageDto(m.getId(), m.getSender(), m.getContent(), m.getCreatedAt().toString()))
                .collect(Collectors.toList()));
    }

    @PostMapping
    public ResponseEntity<?> sendChatMessage(Principal principal,
                                              @RequestBody SendMessageRequest req) {
        UserEntity user = currentUserService.getCurrentUser(principal);
        Long companyId = user.getCompanyId();
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No perteneces a ninguna clínica");
        }
        if (req.content() == null || req.content().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El mensaje no puede estar vacío");
        }

        ClinicChatMessageEntity msg = new ClinicChatMessageEntity();
        msg.setCompanyId(companyId);
        msg.setPatientId(user.getId());
        msg.setSender("PATIENT");
        msg.setContent(req.content());
        chatRepo.save(msg);

        return ResponseEntity.ok(new ChatMessageDto(msg.getId(), msg.getSender(), msg.getContent(), msg.getCreatedAt().toString()));
    }
}
