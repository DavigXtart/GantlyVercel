package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.EvaluationTestEntity;
import com.alvaro.psicoapp.domain.EvaluationTestResultEntity;
import com.alvaro.psicoapp.service.EvaluationTestService;
import com.alvaro.psicoapp.util.InputSanitizer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/evaluation-tests")
public class EvaluationTestController {
    @Autowired
    private EvaluationTestService evaluationTestService;

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
    public ResponseEntity<?> submitResult(Principal principal, @PathVariable Long testId, @RequestBody Map<String, Object> body) {
        try {
            Long userId = Long.valueOf(principal.getName());
            
            // Sanitizar inputs
            if (body.get("answers") != null) {
                body.put("answers", InputSanitizer.sanitize(body.get("answers").toString()));
            }
            
            EvaluationTestResultEntity result = evaluationTestService.saveResult(userId, testId, body);
            return ResponseEntity.ok(Map.of("success", true, "result", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/results")
    public ResponseEntity<?> getUserResults(Principal principal) {
        try {
            Long userId = Long.valueOf(principal.getName());
            List<EvaluationTestResultEntity> results = evaluationTestService.getUserResults(userId);
            return ResponseEntity.ok(Map.of("results", results));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/statistics")
    public ResponseEntity<?> getUserStatistics(Principal principal) {
        try {
            Long userId = Long.valueOf(principal.getName());
            Map<String, Object> stats = evaluationTestService.getUserStatistics(userId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

