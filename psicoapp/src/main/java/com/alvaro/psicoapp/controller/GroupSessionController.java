package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.service.GroupSessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/group-sessions")
public class GroupSessionController {
    private final GroupSessionService groupSessionService;
    private final UserRepository userRepository;

    public GroupSessionController(GroupSessionService groupSessionService, UserRepository userRepository) {
        this.groupSessionService = groupSessionService;
        this.userRepository = userRepository;
    }

    private UserEntity currentUser(Principal principal) {
        return userRepository.findByEmail(principal.getName()).orElseThrow();
    }

    @PostMapping
    public ResponseEntity<?> createSession(Principal principal, @RequestBody Map<String, Object> body) {
        var user = currentUser(principal);
        String title = (String) body.get("title");
        String description = (String) body.get("description");
        Instant startTime = Instant.parse((String) body.get("startTime"));
        Instant endTime = Instant.parse((String) body.get("endTime"));
        Integer maxParticipants = body.get("maxParticipants") != null ? ((Number) body.get("maxParticipants")).intValue() : null;
        var session = groupSessionService.createSession(user, title, description, startTime, endTime, maxParticipants);
        return ResponseEntity.ok(Map.of("id", session.getId(), "message", "Sesión grupal creada exitosamente"));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listUpcoming() {
        return ResponseEntity.ok(groupSessionService.listUpcoming());
    }

    @GetMapping("/my")
    public ResponseEntity<List<Map<String, Object>>> myGroupSessions(Principal principal) {
        return ResponseEntity.ok(groupSessionService.listMyGroupSessions(currentUser(principal)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getSession(@PathVariable Long id) {
        return ResponseEntity.ok(groupSessionService.getSessionDetails(id));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Map<String, String>> joinSession(Principal principal, @PathVariable Long id) {
        groupSessionService.joinSession(currentUser(principal), id);
        return ResponseEntity.ok(Map.of("message", "Te has unido a la sesión grupal"));
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<Map<String, String>> leaveSession(Principal principal, @PathVariable Long id) {
        groupSessionService.leaveSession(currentUser(principal), id);
        return ResponseEntity.ok(Map.of("message", "Has salido de la sesión grupal"));
    }
}
