package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.UserAnswerEntity;
import com.alvaro.psicoapp.domain.TestEntity;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.repository.UserAnswerRepository;
import com.alvaro.psicoapp.repository.TestRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Optional;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/psych")
public class PsychologistController {
    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final TestRepository testRepository;

    public PsychologistController(
            UserRepository userRepository, 
            UserPsychologistRepository userPsychologistRepository,
            UserAnswerRepository userAnswerRepository,
            TestRepository testRepository) {
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.userAnswerRepository = userAnswerRepository;
        this.testRepository = testRepository;
    }

    @GetMapping("/patients")
    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable(value = "psychologistPatients", key = "#principal.name")
    public ResponseEntity<List<Map<String, Object>>> myPatients(Principal principal) {
        var me = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"PSYCHOLOGIST".equals(me.getRole())) return ResponseEntity.status(403).build();
        var rels = userPsychologistRepository.findByPsychologist_Id(me.getId());
        List<Map<String, Object>> out = new ArrayList<>();
        for (var r : rels) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getUser().getId());
            m.put("name", r.getUser().getName());
            m.put("email", r.getUser().getEmail());
            m.put("avatarUrl", r.getUser().getAvatarUrl() != null ? r.getUser().getAvatarUrl() : "");
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }

    // Nota: la asignación de usuarios a psicólogos solo la realiza el admin via /api/admin/users/assign

    // GET: Obtener detalles de un paciente (solo si es paciente del psicólogo)
    @GetMapping("/patients/{patientId}")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getPatientDetails(Principal principal, @PathVariable Long patientId) {
        var me = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"PSYCHOLOGIST".equals(me.getRole())) {
            return ResponseEntity.status(403).build();
        }
        
        // Verificar que el paciente pertenece al psicólogo
        var rel = userPsychologistRepository.findByUserId(patientId);
        if (rel.isEmpty() || !rel.get().getPsychologist().getId().equals(me.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Este usuario no es tu paciente"));
        }
        
        var patient = userRepository.findById(patientId).orElseThrow();
        
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", patient.getId());
        userMap.put("name", patient.getName());
        userMap.put("email", patient.getEmail());
        userMap.put("role", patient.getRole());
        userMap.put("createdAt", patient.getCreatedAt());
        userMap.put("gender", patient.getGender());
        userMap.put("age", patient.getAge());
        userMap.put("avatarUrl", patient.getAvatarUrl());
        
        // Obtener todas las respuestas del usuario agrupadas por test
        List<UserAnswerEntity> allAnswers = userAnswerRepository.findByUserOrderByCreatedAtDesc(patient);
        Map<Long, Map<String, Object>> testsMap = new HashMap<>();
        
        for (UserAnswerEntity ua : allAnswers) {
            Long testId = ua.getQuestion().getTest().getId();
            if (!testsMap.containsKey(testId)) {
                TestEntity test = ua.getQuestion().getTest();
                Map<String, Object> testInfo = new HashMap<>();
                testInfo.put("testId", testId);
                testInfo.put("testCode", test.getCode());
                testInfo.put("testTitle", test.getTitle());
                testInfo.put("answers", new ArrayList<Map<String, Object>>());
                testsMap.put(testId, testInfo);
            }
            
            Map<String, Object> answerInfo = new HashMap<>();
            answerInfo.put("questionId", ua.getQuestion().getId());
            answerInfo.put("questionText", ua.getQuestion().getText());
            answerInfo.put("questionPosition", ua.getQuestion().getPosition());
            answerInfo.put("questionType", ua.getQuestion().getType());
            if (ua.getAnswer() != null) {
                answerInfo.put("answerId", ua.getAnswer().getId());
                answerInfo.put("answerText", ua.getAnswer().getText());
                answerInfo.put("answerValue", ua.getAnswer().getValue());
            }
            if (ua.getNumericValue() != null) {
                answerInfo.put("numericValue", ua.getNumericValue());
            }
            if (ua.getTextValue() != null) {
                answerInfo.put("textValue", ua.getTextValue());
            }
            answerInfo.put("createdAt", ua.getCreatedAt());
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> answers = (List<Map<String, Object>>) testsMap.get(testId).get("answers");
            answers.add(answerInfo);
        }
        
        userMap.put("tests", new ArrayList<>(testsMap.values()));
        return ResponseEntity.ok(userMap);
    }

    // GET: Obtener respuestas de un test asignado específico
    @GetMapping("/patients/{patientId}/tests/{testId}/answers")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getPatientTestAnswers(
            Principal principal, 
            @PathVariable Long patientId,
            @PathVariable Long testId) {
        var me = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"PSYCHOLOGIST".equals(me.getRole())) {
            return ResponseEntity.status(403).build();
        }
        
        // Verificar que el paciente pertenece al psicólogo
        var rel = userPsychologistRepository.findByUserId(patientId);
        if (rel.isEmpty() || !rel.get().getPsychologist().getId().equals(me.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Este usuario no es tu paciente"));
        }
        
        var patient = userRepository.findById(patientId).orElseThrow();
        var test = testRepository.findById(testId).orElseThrow();
        
        // Obtener todas las respuestas del usuario para este test
        List<UserAnswerEntity> allAnswers = userAnswerRepository.findByUserOrderByCreatedAtDesc(patient);
        List<Map<String, Object>> answers = new ArrayList<>();
        
        for (UserAnswerEntity ua : allAnswers) {
            if (!ua.getQuestion().getTest().getId().equals(testId)) {
                continue;
            }
            
            Map<String, Object> answerInfo = new HashMap<>();
            answerInfo.put("questionId", ua.getQuestion().getId());
            answerInfo.put("questionText", ua.getQuestion().getText());
            answerInfo.put("questionPosition", ua.getQuestion().getPosition());
            answerInfo.put("questionType", ua.getQuestion().getType());
            if (ua.getAnswer() != null) {
                answerInfo.put("answerId", ua.getAnswer().getId());
                answerInfo.put("answerText", ua.getAnswer().getText());
                answerInfo.put("answerValue", ua.getAnswer().getValue());
            }
            if (ua.getNumericValue() != null) {
                answerInfo.put("numericValue", ua.getNumericValue());
            }
            if (ua.getTextValue() != null) {
                answerInfo.put("textValue", ua.getTextValue());
            }
            answerInfo.put("createdAt", ua.getCreatedAt());
            answers.add(answerInfo);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("testId", testId);
        response.put("testCode", test.getCode());
        response.put("testTitle", test.getTitle());
        response.put("answers", answers);
        
        return ResponseEntity.ok(response);
    }
}


