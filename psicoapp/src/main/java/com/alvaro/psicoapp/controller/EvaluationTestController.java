package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.EvaluationTestEntity;
import com.alvaro.psicoapp.domain.EvaluationTestResultEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.service.EvaluationTestService;
import com.alvaro.psicoapp.util.InputSanitizer;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/evaluation-tests")
public class EvaluationTestController {
    private final EvaluationTestService evaluationTestService;
    private final UserRepository userRepository;

    public EvaluationTestController(EvaluationTestService evaluationTestService, UserRepository userRepository) {
        this.evaluationTestService = evaluationTestService;
        this.userRepository = userRepository;
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<?> getTestsByCategory(@PathVariable String category) {
        try {
            List<EvaluationTestEntity> tests = evaluationTestService.getTestsByCategory(category);
            return ResponseEntity.ok(Map.of("tests", tests));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/category/{category}/topic/{topic}")
    public ResponseEntity<?> getTestsByTopic(@PathVariable String category, @PathVariable String topic) {
        try {
            List<EvaluationTestEntity> tests = evaluationTestService.getTestsByTopic(category, topic);
            return ResponseEntity.ok(Map.of("tests", tests));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllTests() {
        try {
            List<EvaluationTestEntity> tests = evaluationTestService.getAllActiveTests();
            return ResponseEntity.ok(Map.of("tests", tests));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{testId}/submit")
    public ResponseEntity<?> submitResult(Principal principal, @PathVariable Long testId, @RequestBody com.alvaro.psicoapp.dto.EvaluationTestDtos.SubmitResultRequest req) {
        try {
            UserEntity user = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            EvaluationTestResultEntity result = evaluationTestService.saveResult(user.getId(), testId, req);
            return ResponseEntity.ok(Map.of("success", true, "result", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/results")
    public ResponseEntity<?> getUserResults(Principal principal) {
        try {
            UserEntity user = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            List<EvaluationTestResultEntity> results = evaluationTestService.getUserResults(user.getId());
            return ResponseEntity.ok(Map.of("results", results));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/statistics")
    public ResponseEntity<?> getUserStatistics(Principal principal) {
        try {
            UserEntity user = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            return ResponseEntity.ok(evaluationTestService.getUserStatistics(user.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
