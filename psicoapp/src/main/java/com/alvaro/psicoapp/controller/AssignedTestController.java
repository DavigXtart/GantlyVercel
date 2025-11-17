package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.AssignedTestEntity;
import com.alvaro.psicoapp.domain.TestEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.AssignedTestRepository;
import com.alvaro.psicoapp.repository.TestRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assigned-tests")
@CrossOrigin(origins = "*")
public class AssignedTestController {
    private final AssignedTestRepository assignedTestRepository;
    private final UserRepository userRepository;
    private final TestRepository testRepository;

    public AssignedTestController(AssignedTestRepository assignedTestRepository, UserRepository userRepository, TestRepository testRepository) {
        this.assignedTestRepository = assignedTestRepository;
        this.userRepository = userRepository;
        this.testRepository = testRepository;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> myAssignedTests(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.ok(java.util.Collections.emptyList());
            }
            
            var user = userRepository.findByEmail(principal.getName()).orElse(null);
            if (user == null) {
                return ResponseEntity.ok(java.util.Collections.emptyList());
            }
            
            List<AssignedTestEntity> assignedTests;
            if ("PSYCHOLOGIST".equals(user.getRole())) {
                assignedTests = assignedTestRepository.findByPsychologist_IdOrderByAssignedAtDesc(user.getId());
            } else {
                // Para usuarios, solo mostrar los pendientes
                assignedTests = assignedTestRepository.findByUser_IdAndCompletedAtIsNullOrderByAssignedAtDesc(user.getId());
            }
            
            if (assignedTests == null || assignedTests.isEmpty()) {
                return ResponseEntity.ok(java.util.Collections.emptyList());
            }
            
            // Convertir a Map para evitar problemas de serialización
            List<Map<String, Object>> result = assignedTests.stream().map(at -> {
                try {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", at.getId());
                    
                    // Guardar referencias antes de acceder para evitar problemas de lazy loading
                    UserEntity userEntity = at.getUser();
                    TestEntity testEntity = at.getTest();
                    UserEntity psychEntity = at.getPsychologist();
                    
                    if (userEntity != null) {
                        map.put("userId", userEntity.getId());
                        map.put("userName", userEntity.getName() != null ? userEntity.getName() : "");
                        map.put("userEmail", userEntity.getEmail() != null ? userEntity.getEmail() : "");
                    }
                    
                    if (testEntity != null) {
                        map.put("testId", testEntity.getId());
                        map.put("testTitle", testEntity.getTitle() != null ? testEntity.getTitle() : "");
                        map.put("testCode", testEntity.getCode() != null ? testEntity.getCode() : "");
                        
                        // Agregar objeto test para compatibilidad con el frontend
                        Map<String, Object> testObj = new java.util.HashMap<>();
                        testObj.put("id", testEntity.getId());
                        testObj.put("title", testEntity.getTitle() != null ? testEntity.getTitle() : "");
                        testObj.put("code", testEntity.getCode() != null ? testEntity.getCode() : "");
                        map.put("test", testObj);
                    }
                    
                    if (psychEntity != null) {
                        map.put("psychologistId", psychEntity.getId());
                        map.put("psychologistName", psychEntity.getName() != null ? psychEntity.getName() : "");
                    }
                    
                    map.put("assignedAt", at.getAssignedAt() != null ? at.getAssignedAt().toString() : "");
                    map.put("completedAt", at.getCompletedAt() != null ? at.getCompletedAt().toString() : null);
                    
                    return map;
                } catch (Exception e) {
                    e.printStackTrace();
                    // Retornar un objeto vacío si hay error procesando un test
                    Map<String, Object> errorMap = new java.util.HashMap<>();
                    errorMap.put("id", at.getId());
                    errorMap.put("error", "Error procesando test: " + e.getMessage());
                    return errorMap;
                }
            }).filter(map -> map.get("error") == null) // Filtrar los que tuvieron errores
              .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            // En caso de error, retornar lista vacía en lugar de error 500
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> assignTest(Principal principal, @RequestBody Map<String, Object> body) {
        try {
            var actor = userRepository.findByEmail(principal.getName()).orElseThrow();
            if (!"PSYCHOLOGIST".equals(actor.getRole())) {
                Map<String, Object> errorResponse = new java.util.HashMap<>();
                errorResponse.put("error", "Solo los psicólogos pueden asignar tests");
                return ResponseEntity.status(403).body(errorResponse);
            }
            
            if (body.get("userId") == null || body.get("testId") == null) {
                Map<String, Object> errorResponse = new java.util.HashMap<>();
                errorResponse.put("error", "userId y testId son requeridos");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            Long userId;
            Long testId;
            try {
                userId = Long.valueOf(String.valueOf(body.get("userId")));
                testId = Long.valueOf(String.valueOf(body.get("testId")));
            } catch (NumberFormatException e) {
                Map<String, Object> errorResponse = new java.util.HashMap<>();
                errorResponse.put("error", "userId y testId deben ser números válidos");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + userId));
            TestEntity test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test no encontrado con id: " + testId));

            // Verificar si ya está asignado
            var existing = assignedTestRepository.findByUserAndTest(user, test);
            if (existing.isPresent()) {
                AssignedTestEntity existingAssigned = existing.get();
                Map<String, Object> response = new java.util.HashMap<>();
                response.put("id", existingAssigned.getId());
                response.put("userId", user.getId());
                response.put("testId", test.getId());
                response.put("psychologistId", actor.getId());
                response.put("assignedAt", existingAssigned.getAssignedAt());
                response.put("completedAt", existingAssigned.getCompletedAt());
                return ResponseEntity.ok(response);
            }

            AssignedTestEntity assigned = new AssignedTestEntity();
            assigned.setUser(user);
            assigned.setPsychologist(actor);
            assigned.setTest(test);
            assigned.setAssignedAt(Instant.now());
            AssignedTestEntity saved = assignedTestRepository.save(assigned);
            
            // Construir respuesta sin relaciones circulares usando los objetos ya cargados
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("id", saved.getId());
            response.put("userId", user.getId());
            response.put("testId", test.getId());
            response.put("psychologistId", actor.getId());
            response.put("assignedAt", saved.getAssignedAt());
            response.put("completedAt", saved.getCompletedAt());
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new java.util.HashMap<>();
            errorResponse.put("error", e.getMessage() != null ? e.getMessage() : "Error desconocido");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new java.util.HashMap<>();
            errorResponse.put("error", "Error interno del servidor: " + (e.getMessage() != null ? e.getMessage() : "Error desconocido"));
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> unassignTest(Principal principal, @PathVariable Long id) {
        var actor = userRepository.findByEmail(principal.getName()).orElseThrow();
        var assigned = assignedTestRepository.findById(id).orElseThrow();
        
        if (!"PSYCHOLOGIST".equals(actor.getRole()) || !assigned.getPsychologist().getId().equals(actor.getId())) {
            return ResponseEntity.status(403).build();
        }
        
        assignedTestRepository.delete(assigned);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/complete")
    @Transactional
    public ResponseEntity<Map<String, Object>> markAsCompleted(Principal principal, @PathVariable Long id) {
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        var assigned = assignedTestRepository.findById(id).orElseThrow();
        
        if (!assigned.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }
        
        // Guardar referencias antes de modificar
        Long userId = assigned.getUser().getId();
        Long testId = assigned.getTest().getId();
        Long psychologistId = assigned.getPsychologist().getId();
        Instant assignedAt = assigned.getAssignedAt();
        
        assigned.setCompletedAt(Instant.now());
        AssignedTestEntity saved = assignedTestRepository.save(assigned);
        
        // Construir respuesta sin relaciones circulares usando las referencias guardadas
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("id", saved.getId());
        response.put("userId", userId);
        response.put("testId", testId);
        response.put("psychologistId", psychologistId);
        response.put("assignedAt", assignedAt);
        response.put("completedAt", saved.getCompletedAt());
        
        return ResponseEntity.ok(response);
    }
}

