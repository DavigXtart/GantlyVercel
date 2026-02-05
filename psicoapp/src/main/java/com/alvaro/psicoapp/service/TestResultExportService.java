package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.TestEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.TestRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;

@Service
public class TestResultExportService {
    private final UserRepository userRepository;
    private final TestRepository testRepository;
    private final ExcelExportService excelExportService;
    private final TestResultService testResultService;

    public TestResultExportService(UserRepository userRepository,
                                   TestRepository testRepository,
                                   ExcelExportService excelExportService,
                                   TestResultService testResultService) {
        this.userRepository = userRepository;
        this.testRepository = testRepository;
        this.excelExportService = excelExportService;
        this.testResultService = testResultService;
    }

    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportUserTestResults(Long userId, Long testId) throws IOException {
        byte[] excelBytes = excelExportService.exportTestResults(userId, testId);
        TestEntity test = testRepository.findById(testId).orElseThrow();
        UserEntity user = userRepository.findById(userId).orElseThrow();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "resultados_" + test.getCode() + "_" + user.getId() + ".xlsx");
        return ResponseEntity.ok().headers(headers).body(excelBytes);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportUserAllResults(Long userId) throws IOException {
        UserEntity user = userRepository.findById(userId).orElseThrow();
        byte[] excelBytes = excelExportService.exportUserResults(userId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        String safeName = user.getName().replaceAll("[^a-zA-Z0-9]", "_");
        headers.setContentDispositionFormData("attachment", "resultados_" + safeName + ".xlsx");
        return ResponseEntity.ok().headers(headers).body(excelBytes);
    }

    @Transactional
    public void recalculateForUserTest(String principalEmail, Long testId) {
        UserEntity user = userRepository.findByEmail(principalEmail).orElseThrow();
        TestEntity test = testRepository.findById(testId).orElseThrow();
        testResultService.calculateAndSaveResults(user, null, test);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportMyResults(String principalEmail) throws IOException {
        UserEntity user = userRepository.findByEmail(principalEmail).orElseThrow();
        byte[] excelBytes = excelExportService.exportUserResults(user.getId());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "resultados_" + user.getEmail() + ".xlsx");
        return ResponseEntity.ok().headers(headers).body(excelBytes);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportMyTestResults(String principalEmail, Long testId) throws IOException {
        UserEntity user = userRepository.findByEmail(principalEmail).orElseThrow();
        byte[] excelBytes = excelExportService.exportTestResults(user.getId(), testId);
        TestEntity test = testRepository.findById(testId).orElseThrow();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "resultados_" + test.getCode() + ".xlsx");
        return ResponseEntity.ok().headers(headers).body(excelBytes);
    }
}

