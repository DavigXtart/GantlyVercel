package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.TestEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.TestResultDtos;
import com.alvaro.psicoapp.repository.TestRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.service.ExcelExportService;
import com.alvaro.psicoapp.service.TestResultService;
import com.alvaro.psicoapp.service.TestResultExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/results")
public class TestResultController {
    private final UserRepository userRepository;
    private final TestRepository testRepository;
    private final TestResultService testResultService;
    private final ExcelExportService excelExportService;
    private final TestResultExportService testResultExportService;

    public TestResultController(UserRepository userRepository, TestRepository testRepository,
                                TestResultService testResultService, ExcelExportService excelExportService,
                                TestResultExportService testResultExportService) {
        this.userRepository = userRepository;
        this.testRepository = testRepository;
        this.testResultService = testResultService;
        this.excelExportService = excelExportService;
        this.testResultExportService = testResultExportService;
    }

    @GetMapping("/my-results")
    public ResponseEntity<TestResultDtos.MyResultsResponse> getMyResults(Principal principal) {
        UserEntity user = userRepository.findByEmail(principal.getName()).orElseThrow();
        return ResponseEntity.ok(testResultService.getMyResults(user));
    }

    @GetMapping("/test/{testId}")
    public ResponseEntity<TestResultDtos.TestResultsResponse> getTestResults(Principal principal, @PathVariable Long testId) {
        UserEntity user = userRepository.findByEmail(principal.getName()).orElseThrow();
        return ResponseEntity.ok(testResultService.getTestResults(user, testId));
    }

    @GetMapping("/user/{userId}/test/{testId}")
    public ResponseEntity<TestResultDtos.UserTestResultsResponse> getUserTestResults(@PathVariable Long userId, @PathVariable Long testId) {
        return ResponseEntity.ok(testResultService.getUserTestResults(userId, testId));
    }

    @GetMapping("/user/{userId}/test/{testId}/export")
    public ResponseEntity<byte[]> exportUserTestResults(@PathVariable Long userId, @PathVariable Long testId) {
        try {
            return testResultExportService.exportUserTestResults(userId, testId);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/user/{userId}/export")
    public ResponseEntity<byte[]> exportUserAllResults(@PathVariable Long userId) {
        try {
            return testResultExportService.exportUserAllResults(userId);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/test/{testId}/recalculate")
    public ResponseEntity<Void> recalculateResults(Principal principal, @PathVariable Long testId) {
        testResultExportService.recalculateForUserTest(principal.getName(), testId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportMyResults(Principal principal) {
        try {
            return testResultExportService.exportMyResults(principal.getName());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/test/{testId}/export")
    public ResponseEntity<byte[]> exportTestResults(Principal principal, @PathVariable Long testId) {
        try {
            return testResultExportService.exportMyTestResults(principal.getName(), testId);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
