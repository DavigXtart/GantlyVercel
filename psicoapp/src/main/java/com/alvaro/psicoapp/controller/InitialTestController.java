package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.dto.InitialTestDtos;
import com.alvaro.psicoapp.service.InitialTestService;
import com.alvaro.psicoapp.service.TemporarySessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/initial-test")
public class InitialTestController {
    private final TemporarySessionService sessionService;
    private final InitialTestService initialTestService;

    public InitialTestController(TemporarySessionService sessionService, InitialTestService initialTestService) {
        this.sessionService = sessionService;
        this.initialTestService = initialTestService;
    }

    @PostMapping("/session")
    public ResponseEntity<Map<String, String>> createSession() {
        var session = sessionService.createSession();
        return ResponseEntity.ok(Map.of("sessionId", session.getSessionId()));
    }

    @GetMapping
    public ResponseEntity<?> getInitialTest(@RequestParam String sessionId) {
        try {
            return ResponseEntity.ok(initialTestService.getInitialTest(sessionId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Error"));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus(@RequestParam String sessionId) {
        try {
            return ResponseEntity.ok(initialTestService.getStatus(sessionId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitInitialTest(@RequestParam String sessionId, @RequestBody InitialTestDtos.SubmitRequest req) {
        try {
            if (req.answers() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Sesión no válida o expirada"));
            }
            return ResponseEntity.ok(initialTestService.submitInitialTest(sessionId, req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error al procesar las respuestas: " + e.getMessage()));
        }
    }
}
