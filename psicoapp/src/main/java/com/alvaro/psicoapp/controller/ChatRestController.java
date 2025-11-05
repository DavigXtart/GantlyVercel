package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.repository.ChatMessageRepository;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
public class ChatRestController {
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;

    public ChatRestController(ChatMessageRepository chatMessageRepository, UserRepository userRepository, UserPsychologistRepository userPsychologistRepository) {
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
    }

    // Usuario: historial con su psicólogo asignado
    @GetMapping("/history")
    @Transactional(readOnly = true)
    public ResponseEntity<?> myHistory(Principal principal, @RequestParam(required = false) Long userId) {
        var me = userRepository.findByEmail(principal.getName()).orElseThrow();
        List<com.alvaro.psicoapp.domain.ChatMessageEntity> messages;
        
        if ("USER".equals(me.getRole())) {
            var rel = userPsychologistRepository.findByUserId(me.getId());
            if (rel.isEmpty()) return ResponseEntity.ok(List.of());
            var psychId = rel.get().getPsychologist().getId();
            messages = chatMessageRepository.findTop100ByPsychologist_IdAndUser_IdOrderByCreatedAtDesc(psychId, me.getId());
        } else if ("PSYCHOLOGIST".equals(me.getRole())) {
            if (userId == null) return ResponseEntity.badRequest().body("userId requerido");
            messages = chatMessageRepository.findTop100ByPsychologist_IdAndUser_IdOrderByCreatedAtDesc(me.getId(), userId);
        } else {
            return ResponseEntity.status(403).build();
        }
        
        // Convertir a DTOs para evitar problemas de serialización
        List<Map<String, Object>> result = messages.stream().map(msg -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", msg.getId());
            dto.put("sender", msg.getSender());
            dto.put("content", msg.getContent());
            dto.put("createdAt", msg.getCreatedAt() != null ? msg.getCreatedAt().toString() : null);
            return dto;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(result);
    }
}


