package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.repository.*;
import com.alvaro.psicoapp.service.MatchingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/matching")
public class MatchingController {
    
    @Autowired
    private TestRepository testRepository;
    
    @Autowired
    private QuestionRepository questionRepository;
    
    @Autowired
    private AnswerRepository answerRepository;
    
    @Autowired
    private UserAnswerRepository userAnswerRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private MatchingService matchingService;
    
    @Autowired
    private AppointmentRatingRepository appointmentRatingRepository;
    
    private static final String PATIENT_MATCHING_TEST_CODE = "PATIENT_MATCHING";
    private static final String PSYCHOLOGIST_MATCHING_TEST_CODE = "PSYCHOLOGIST_MATCHING";
    
    /**
     * Obtener el test de matching para el paciente
     */
    @GetMapping("/patient-test")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getPatientMatchingTest(Principal principal) {
        try {
            TestEntity test = testRepository.findByCode(PATIENT_MATCHING_TEST_CODE)
                .orElseThrow(() -> new RuntimeException("Test de matching de paciente no encontrado."));
            
            List<QuestionEntity> questions = questionRepository.findByTestOrderByPositionAsc(test);
            List<Map<String, Object>> questionsList = new ArrayList<>();
            
            for (QuestionEntity q : questions) {
                Map<String, Object> qMap = new HashMap<>();
                qMap.put("id", q.getId());
                qMap.put("text", q.getText());
                qMap.put("type", q.getType());
                qMap.put("position", q.getPosition());
                
                List<AnswerEntity> answers = answerRepository.findByQuestionOrderByPositionAsc(q);
                List<Map<String, Object>> answersList = answers.stream().map(a -> {
                    Map<String, Object> aMap = new HashMap<>();
                    aMap.put("id", a.getId());
                    aMap.put("text", a.getText());
                    aMap.put("value", a.getValue());
                    aMap.put("position", a.getPosition());
                    return aMap;
                }).collect(Collectors.toList());
                
                qMap.put("answers", answersList);
                questionsList.add(qMap);
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("id", test.getId());
            result.put("code", test.getCode());
            result.put("title", test.getTitle());
            result.put("description", test.getDescription());
            result.put("questions", questionsList);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Obtener el test de matching para el psicólogo
     */
    @GetMapping("/psychologist-test")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getPsychologistMatchingTest(Principal principal) {
        try {
            var user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            if (!"PSYCHOLOGIST".equals(user.getRole())) {
                return ResponseEntity.status(403).body(Map.of("error", "Solo psicólogos pueden acceder a este test"));
            }
            
            TestEntity test = testRepository.findByCode(PSYCHOLOGIST_MATCHING_TEST_CODE)
                .orElseThrow(() -> new RuntimeException("Test de matching de psicólogo no encontrado."));
            
            List<QuestionEntity> questions = questionRepository.findByTestOrderByPositionAsc(test);
            List<Map<String, Object>> questionsList = new ArrayList<>();
            
            for (QuestionEntity q : questions) {
                Map<String, Object> qMap = new HashMap<>();
                qMap.put("id", q.getId());
                qMap.put("text", q.getText());
                qMap.put("type", q.getType());
                qMap.put("position", q.getPosition());
                
                List<AnswerEntity> answers = answerRepository.findByQuestionOrderByPositionAsc(q);
                List<Map<String, Object>> answersList = answers.stream().map(a -> {
                    Map<String, Object> aMap = new HashMap<>();
                    aMap.put("id", a.getId());
                    aMap.put("text", a.getText());
                    aMap.put("value", a.getValue());
                    aMap.put("position", a.getPosition());
                    return aMap;
                }).collect(Collectors.toList());
                
                qMap.put("answers", answersList);
                questionsList.add(qMap);
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("id", test.getId());
            result.put("code", test.getCode());
            result.put("title", test.getTitle());
            result.put("description", test.getDescription());
            result.put("questions", questionsList);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Guardar respuestas del test de matching del paciente
     */
    @PostMapping("/patient-test/submit")
    @Transactional
    public ResponseEntity<?> submitPatientMatchingTest(Principal principal, @RequestBody Map<String, Object> body) {
        try {
            UserEntity user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            TestEntity test = testRepository.findByCode(PATIENT_MATCHING_TEST_CODE)
                .orElseThrow(() -> new RuntimeException("Test de matching de paciente no encontrado"));
            
            saveMatchingTestAnswers(user, test, PATIENT_MATCHING_TEST_CODE, body);
            return ResponseEntity.ok(Map.of("success", true, "message", "Test de matching completado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Guardar respuestas del test de matching del psicólogo
     */
    @PostMapping("/psychologist-test/submit")
    @Transactional
    public ResponseEntity<?> submitPsychologistMatchingTest(Principal principal, @RequestBody Map<String, Object> body) {
        try {
            UserEntity user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            if (!"PSYCHOLOGIST".equals(user.getRole())) {
                return ResponseEntity.status(403).body(Map.of("error", "Solo psicólogos pueden acceder a este test"));
            }
            
            TestEntity test = testRepository.findByCode(PSYCHOLOGIST_MATCHING_TEST_CODE)
                .orElseThrow(() -> new RuntimeException("Test de matching de psicólogo no encontrado"));
            
            saveMatchingTestAnswers(user, test, PSYCHOLOGIST_MATCHING_TEST_CODE, body);
            return ResponseEntity.ok(Map.of("success", true, "message", "Test de matching completado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Método privado para guardar respuestas del test de matching (compartido entre paciente y psicólogo)
     */
    private void saveMatchingTestAnswers(UserEntity user, TestEntity test, String testCode, Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> answersList = (List<Map<String, Object>>) body.get("answers");
        
        if (answersList == null) {
            throw new IllegalArgumentException("No se proporcionaron respuestas");
        }
        
        // Eliminar respuestas anteriores del usuario para este test
        List<UserAnswerEntity> existingAnswers = userAnswerRepository.findByUser(user).stream()
            .filter(ua -> ua.getQuestion().getTest().getCode().equals(testCode))
            .collect(Collectors.toList());
        userAnswerRepository.deleteAll(existingAnswers);
        
        // Guardar nuevas respuestas (puede haber múltiples para preguntas MULTIPLE)
        for (Map<String, Object> answerData : answersList) {
            Long questionId = answerData.get("questionId") != null ? 
                Long.valueOf(answerData.get("questionId").toString()) : null;
            Long answerId = answerData.get("answerId") != null ? 
                Long.valueOf(answerData.get("answerId").toString()) : null;
            Double numericValue = answerData.get("numericValue") != null ? 
                Double.valueOf(answerData.get("numericValue").toString()) : null;
            String textValue = answerData.get("textValue") != null ? 
                answerData.get("textValue").toString() : null;
            
            if (questionId == null) continue;
            
            QuestionEntity question = questionRepository.findById(questionId)
                .orElse(null);
            if (question == null || !question.getTest().getId().equals(test.getId())) {
                continue;
            }
            
            boolean hasPayload = (answerId != null) || (numericValue != null) 
                || (textValue != null && !textValue.trim().isEmpty());
            if (!hasPayload) continue;
            
            UserAnswerEntity ua = new UserAnswerEntity();
            ua.setUser(user);
            ua.setQuestion(question);
            if (answerId != null) {
                answerRepository.findById(answerId).ifPresent(ua::setAnswer);
            }
            if (numericValue != null) {
                ua.setNumericValue(numericValue);
            }
            if (textValue != null && !textValue.trim().isEmpty()) {
                ua.setTextValue(textValue.trim());
            }
            userAnswerRepository.save(ua);
        }
    }
    
    /**
     * Obtener psicólogos con matching calculado para el paciente autenticado
     */
    @GetMapping("/psychologists")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMatchingPsychologists(Principal principal) {
        try {
            UserEntity patient = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            List<MatchingService.MatchingResult> results = matchingService.calculateMatching(patient.getId());
            
            List<Map<String, Object>> psychologistsList = new ArrayList<>();
            for (MatchingService.MatchingResult result : results) {
                UserEntity psychologist = result.getPsychologist();
                Map<String, Object> psychMap = new HashMap<>();
                psychMap.put("id", psychologist.getId());
                psychMap.put("name", psychologist.getName());
                psychMap.put("email", psychologist.getEmail());
                psychMap.put("avatarUrl", psychologist.getAvatarUrl());
                psychMap.put("gender", psychologist.getGender());
                psychMap.put("age", psychologist.getAge());
                psychMap.put("affinityScore", result.getAffinityScore());
                psychMap.put("matchPercentage", result.getMatchPercentage());
                
                // Obtener rating del psicólogo
                Double averageRating = appointmentRatingRepository.findAverageRatingByPsychologistId(psychologist.getId());
                Long totalRatings = appointmentRatingRepository.countByPsychologistId(psychologist.getId());
                
                if (averageRating != null) {
                    psychMap.put("averageRating", Math.round(averageRating * 10.0) / 10.0);
                } else {
                    psychMap.put("averageRating", null);
                }
                psychMap.put("totalRatings", totalRatings != null ? totalRatings : 0);
                
                psychologistsList.add(psychMap);
            }
            
            return ResponseEntity.ok(Map.of("psychologists", psychologistsList));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Verificar si el psicólogo ha completado el test de matching
     */
    @GetMapping("/psychologist-test/status")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getPsychologistMatchingTestStatus(Principal principal) {
        try {
            UserEntity user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            if (!"PSYCHOLOGIST".equals(user.getRole())) {
                return ResponseEntity.status(403).body(Map.of("error", "Solo psicólogos pueden acceder a este endpoint"));
            }
            
            TestEntity test = testRepository.findByCode(PSYCHOLOGIST_MATCHING_TEST_CODE)
                .orElseThrow(() -> new RuntimeException("Test de matching de psicólogo no encontrado."));
            
            List<UserAnswerEntity> answers = userAnswerRepository.findByUser(user).stream()
                .filter(ua -> ua.getQuestion().getTest().getCode().equals(PSYCHOLOGIST_MATCHING_TEST_CODE))
                .collect(Collectors.toList());
            
            boolean completed = !answers.isEmpty();
            
            return ResponseEntity.ok(Map.of("completed", completed));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

