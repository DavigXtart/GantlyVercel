package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.dto.AdminDtos;
import com.alvaro.psicoapp.service.AdminService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);
    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/tests")
    public List<TestEntity> listTests() {
        return adminService.listTests();
    }

    @GetMapping("/tests/{id}")
    public ResponseEntity<TestEntity> getTestWithDetails(@PathVariable Long id) {
        return adminService.getTestWithDetails(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/tests")
    public ResponseEntity<TestEntity> createTest(@RequestBody AdminDtos.TestCreate req) {
        return ResponseEntity.ok(adminService.createTest(req));
    }

    @PutMapping("/tests/{id}")
    public ResponseEntity<TestEntity> updateTest(@PathVariable Long id, @RequestBody AdminDtos.TestUpdate req) {
        return adminService.updateTest(id, req)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/tests/{id}")
    public ResponseEntity<Void> deleteTest(@PathVariable Long id) {
        return adminService.deleteTest(id) ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/tests/{testId}/structure")
    public ResponseEntity<Map<String, Object>> getTestStructure(@PathVariable Long testId) {
        return adminService.getTestStructure(testId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/factors")
    public ResponseEntity<AdminDtos.FactorCreateResponse> createFactor(@RequestBody AdminDtos.FactorCreate req) {
        return ResponseEntity.ok(adminService.createFactor(req));
    }

    @PostMapping("/subfactors")
    public ResponseEntity<Map<String, Object>> createSubfactor(@RequestBody AdminDtos.SubfactorCreate req) {
        return ResponseEntity.ok(adminService.createSubfactor(req));
    }

    @PostMapping("/tests/{testId}/init-structure")
    public ResponseEntity<?> initDefaultStructure(@PathVariable Long testId) {
        try {
            return ResponseEntity.ok(adminService.initDefaultStructure(testId));
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getReason()));
        }
    }

    @GetMapping("/tests/{testId}/questions")
    public List<AdminDtos.QuestionDto> getQuestions(@PathVariable Long testId) {
        return adminService.getQuestions(testId);
    }

    @PostMapping("/questions")
    public ResponseEntity<AdminDtos.QuestionCreateResponse> createQuestion(@RequestBody AdminDtos.QuestionCreate req) {
        return ResponseEntity.ok(adminService.createQuestion(req));
    }

    @PutMapping("/questions/{id}")
    public ResponseEntity<QuestionEntity> updateQuestion(@PathVariable Long id, @RequestBody AdminDtos.QuestionUpdate req) {
        return adminService.updateQuestion(id, req)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/questions/{id}/subfactor")
    public ResponseEntity<Void> setQuestionSubfactor(@PathVariable Long id, @RequestBody AdminDtos.SetSubfactorReq req) {
        return adminService.setQuestionSubfactor(id, req) ? ResponseEntity.ok().<Void>build() : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        return adminService.deleteQuestion(id) ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/questions/{questionId}/answers")
    public ResponseEntity<List<AdminDtos.AnswerDto>> getAnswers(@PathVariable Long questionId) {
        return ResponseEntity.ok(adminService.getAnswers(questionId));
    }

    @PostMapping("/answers")
    public ResponseEntity<AnswerEntity> createAnswer(@RequestBody AdminDtos.AnswerCreate req) {
        return ResponseEntity.ok(adminService.createAnswer(req));
    }

    @PutMapping("/answers/{id}")
    public ResponseEntity<AnswerEntity> updateAnswer(@PathVariable Long id, @RequestBody AdminDtos.AnswerUpdate req) {
        return adminService.updateAnswer(id, req)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/answers/{id}")
    public ResponseEntity<Void> deleteAnswer(@PathVariable Long id) {
        return adminService.deleteAnswer(id) ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/users")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<AdminDtos.UserListDto> listUsers() {
        return adminService.listUsers();
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<AdminDtos.UserDetailDto> getUserDetails(@PathVariable Long userId) {
        return adminService.getUserDetails(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tests/{testId}/user-answers")
    public ResponseEntity<List<AdminDtos.UserTestAnswersDto>> getTestUserAnswers(@PathVariable Long testId) {
        return adminService.getTestUserAnswers(testId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/evaluation-tests")
    public List<EvaluationTestEntity> listEvaluationTests() {
        return adminService.listEvaluationTests();
    }

    @GetMapping("/evaluation-tests/{id}")
    public ResponseEntity<EvaluationTestEntity> getEvaluationTest(@PathVariable Long id) {
        return adminService.getEvaluationTest(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/evaluation-tests")
    public ResponseEntity<EvaluationTestEntity> createEvaluationTest(@RequestBody AdminDtos.EvaluationTestCreate req) {
        return ResponseEntity.ok(adminService.createEvaluationTest(req));
    }

    @PutMapping("/evaluation-tests/{id}")
    public ResponseEntity<EvaluationTestEntity> updateEvaluationTest(@PathVariable Long id, @RequestBody AdminDtos.EvaluationTestUpdate req) {
        return adminService.updateEvaluationTest(id, req)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/evaluation-tests/{id}")
    public ResponseEntity<Void> deleteEvaluationTest(@PathVariable Long id) {
        return adminService.deleteEvaluationTest(id) ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/statistics")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<?> getStatistics() {
        try {
            return ResponseEntity.ok(adminService.getStatistics());
        } catch (Exception e) {
            logger.error("Error obteniendo estadísticas", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
