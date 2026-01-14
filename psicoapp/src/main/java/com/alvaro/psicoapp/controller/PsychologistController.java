package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.UserAnswerEntity;
import com.alvaro.psicoapp.domain.TestEntity;
import com.alvaro.psicoapp.domain.PsychologistProfileEntity;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.repository.UserAnswerRepository;
import com.alvaro.psicoapp.repository.TestRepository;
import com.alvaro.psicoapp.repository.PsychologistProfileRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Optional;
import java.time.Instant;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/psych")
public class PsychologistController {
    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final TestRepository testRepository;
    private final PsychologistProfileRepository psychologistProfileRepository;

    public PsychologistController(
            UserRepository userRepository, 
            UserPsychologistRepository userPsychologistRepository,
            UserAnswerRepository userAnswerRepository,
            TestRepository testRepository,
            PsychologistProfileRepository psychologistProfileRepository) {
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.userAnswerRepository = userAnswerRepository;
        this.testRepository = testRepository;
        this.psychologistProfileRepository = psychologistProfileRepository;
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
            m.put("gender", r.getUser().getGender());
            m.put("age", r.getUser().getAge());
            m.put("status", r.getStatus() != null ? r.getStatus() : "ACTIVE");
            m.put("assignedAt", r.getAssignedAt());
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

    // GET: Obtener perfil del psicólogo
    @GetMapping("/profile")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getMyProfile(Principal principal) {
        var me = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"PSYCHOLOGIST".equals(me.getRole())) {
            return ResponseEntity.status(403).build();
        }
        
        var profile = psychologistProfileRepository.findByUser(me);
        Map<String, Object> response = new HashMap<>();
        response.put("userId", me.getId());
        response.put("name", me.getName());
        response.put("email", me.getEmail());
        response.put("avatarUrl", me.getAvatarUrl());
        response.put("gender", me.getGender());
        response.put("age", me.getAge());
        response.put("isFull", me.getIsFull() != null ? me.getIsFull() : false);
        
        if (profile.isPresent()) {
            var p = profile.get();
            response.put("bio", p.getBio());
            response.put("education", p.getEducation());
            response.put("certifications", p.getCertifications());
            response.put("interests", p.getInterests());
            response.put("specializations", p.getSpecializations());
            response.put("experience", p.getExperience());
            response.put("languages", p.getLanguages());
            response.put("linkedinUrl", p.getLinkedinUrl());
            response.put("website", p.getWebsite());
            response.put("sessionPrices", p.getSessionPrices());
            response.put("updatedAt", p.getUpdatedAt());
        } else {
            // Crear perfil vacío si no existe
            response.put("bio", null);
            response.put("education", null);
            response.put("certifications", null);
            response.put("interests", null);
            response.put("specializations", null);
            response.put("experience", null);
            response.put("languages", null);
            response.put("linkedinUrl", null);
            response.put("website", null);
            response.put("sessionPrices", null);
            response.put("updatedAt", null);
        }
        
        return ResponseEntity.ok(response);
    }

    // PUT: Actualizar perfil del psicólogo
    @PutMapping("/profile")
    @Transactional
    public ResponseEntity<Map<String, Object>> updateProfile(Principal principal, @RequestBody Map<String, Object> body) {
        var me = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"PSYCHOLOGIST".equals(me.getRole())) {
            return ResponseEntity.status(403).build();
        }
        
        var profileOpt = psychologistProfileRepository.findByUser(me);
        PsychologistProfileEntity profile;
        
        if (profileOpt.isPresent()) {
            profile = profileOpt.get();
        } else {
            profile = new PsychologistProfileEntity();
            profile.setUser(me);
        }
        
        if (body.containsKey("bio")) profile.setBio((String) body.get("bio"));
        if (body.containsKey("education")) profile.setEducation((String) body.get("education"));
        if (body.containsKey("certifications")) profile.setCertifications((String) body.get("certifications"));
        if (body.containsKey("interests")) profile.setInterests((String) body.get("interests"));
        if (body.containsKey("specializations")) profile.setSpecializations((String) body.get("specializations"));
        if (body.containsKey("experience")) profile.setExperience((String) body.get("experience"));
        if (body.containsKey("languages")) profile.setLanguages((String) body.get("languages"));
        if (body.containsKey("linkedinUrl")) profile.setLinkedinUrl((String) body.get("linkedinUrl"));
        if (body.containsKey("website")) profile.setWebsite((String) body.get("website"));
        if (body.containsKey("sessionPrices")) profile.setSessionPrices((String) body.get("sessionPrices"));
        
        profile.setUpdatedAt(Instant.now());
        psychologistProfileRepository.save(profile);
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Perfil actualizado exitosamente");
        return ResponseEntity.ok(response);
    }

    // PUT: Actualizar flag "estoy lleno"
    @PutMapping("/is-full")
    @Transactional
    public ResponseEntity<Map<String, Object>> updateIsFull(Principal principal, @RequestBody Map<String, Object> body) {
        var me = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"PSYCHOLOGIST".equals(me.getRole())) {
            return ResponseEntity.status(403).build();
        }
        
        if (body.containsKey("isFull")) {
            Boolean isFull = body.get("isFull") instanceof Boolean 
                ? (Boolean) body.get("isFull")
                : Boolean.parseBoolean(String.valueOf(body.get("isFull")));
            me.setIsFull(isFull);
            userRepository.save(me);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Estado actualizado exitosamente");
        response.put("isFull", me.getIsFull());
        return ResponseEntity.ok(response);
    }

    // PUT: Cambiar status de un paciente (dar de alta/baja)
    @PutMapping("/patients/{patientId}/status")
    @Transactional
    public ResponseEntity<Map<String, Object>> updatePatientStatus(Principal principal, @PathVariable Long patientId, @RequestBody Map<String, Object> body) {
        var me = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"PSYCHOLOGIST".equals(me.getRole())) {
            return ResponseEntity.status(403).build();
        }
        
        var relOpt = userPsychologistRepository.findByUserId(patientId);
        if (relOpt.isEmpty() || !relOpt.get().getPsychologist().getId().equals(me.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Este usuario no es tu paciente"));
        }
        
        var rel = relOpt.get();
        if (body.containsKey("status")) {
            String status = (String) body.get("status");
            if (!"ACTIVE".equals(status) && !"DISCHARGED".equals(status)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status debe ser ACTIVE o DISCHARGED"));
            }
            rel.setStatus(status);
            userPsychologistRepository.save(rel);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Status del paciente actualizado exitosamente");
        response.put("status", rel.getStatus());
        return ResponseEntity.ok(response);
    }
}


