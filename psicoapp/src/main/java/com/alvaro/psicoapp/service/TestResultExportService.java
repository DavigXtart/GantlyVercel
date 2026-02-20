package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.TestEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.TestRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

/**
 * Servicio de exportación de resultados con validaciones RGPD.
 * Solo el psicólogo asignado puede exportar datos de pacientes.
 */
@Service
public class TestResultExportService {
    private final UserRepository userRepository;
    private final TestRepository testRepository;
    private final ExcelExportService excelExportService;
    private final TestResultService testResultService;
    private final UserPsychologistRepository userPsychologistRepository;
    private final AuditService auditService;

    public TestResultExportService(UserRepository userRepository,
                                   TestRepository testRepository,
                                   ExcelExportService excelExportService,
                                   TestResultService testResultService,
                                   UserPsychologistRepository userPsychologistRepository,
                                   AuditService auditService) {
        this.userRepository = userRepository;
        this.testRepository = testRepository;
        this.excelExportService = excelExportService;
        this.testResultService = testResultService;
        this.userPsychologistRepository = userPsychologistRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportUserTestResults(UserEntity requester, Long userId, Long testId) throws IOException {
        // VALIDACIÓN CRÍTICA RGPD: Solo el psicólogo asignado puede exportar resultados
        if (!RoleConstants.PSYCHOLOGIST.equals(requester.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo psicólogos pueden exportar resultados de pacientes");
        }
        
        // Verificar que el paciente pertenece a este psicólogo
        var rel = userPsychologistRepository.findByUserId(userId);
        if (rel.isEmpty() || !rel.get().getPsychologist().getId().equals(requester.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este usuario no es tu paciente");
        }
        
        TestEntity test = testRepository.findById(testId).orElseThrow();
        UserEntity user = userRepository.findById(userId).orElseThrow();
        
        // Auditoría RGPD: registrar exportación de datos
        auditService.logDataExport(requester.getId(), requester.getRole(), userId, "TEST_RESULTS", "EXCEL");
        
        byte[] excelBytes = excelExportService.exportTestResults(userId, testId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "resultados_" + test.getCode() + "_" + user.getId() + ".xlsx");
        return ResponseEntity.ok().headers(headers).body(excelBytes);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportUserAllResults(UserEntity requester, Long userId) throws IOException {
        // VALIDACIÓN CRÍTICA RGPD: Solo el psicólogo asignado puede exportar resultados
        if (!RoleConstants.PSYCHOLOGIST.equals(requester.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo psicólogos pueden exportar resultados de pacientes");
        }
        
        // Verificar que el paciente pertenece a este psicólogo
        var rel = userPsychologistRepository.findByUserId(userId);
        if (rel.isEmpty() || !rel.get().getPsychologist().getId().equals(requester.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este usuario no es tu paciente");
        }
        
        UserEntity user = userRepository.findById(userId).orElseThrow();
        
        // Auditoría RGPD: registrar exportación de datos
        auditService.logDataExport(requester.getId(), requester.getRole(), userId, "ALL_TEST_RESULTS", "EXCEL");
        
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

