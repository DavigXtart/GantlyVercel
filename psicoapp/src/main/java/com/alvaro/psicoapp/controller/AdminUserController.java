package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.domain.UserPsychologistEntity;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;
    private final EntityManager entityManager;

    public AdminUserController(UserRepository userRepository, UserPsychologistRepository userPsychologistRepository, EntityManager entityManager) {
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.entityManager = entityManager;
    }

    public static class AssignRequest {
        public Long userId;
        public Long psychologistId;
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public Long getPsychologistId() { return psychologistId; }
        public void setPsychologistId(Long psychologistId) { this.psychologistId = psychologistId; }
    }


    @PostMapping("/role")
    @Transactional
    public ResponseEntity<Void> setRole(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        String role = body.get("role").toString(); // USER, ADMIN, PSYCHOLOGIST
        UserEntity u = userRepository.findById(userId).orElseThrow();
        u.setRole(role);
        userRepository.save(u);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/psychologists")
    public ResponseEntity<List<UserEntity>> listPsychologists() {
        return ResponseEntity.ok(userRepository.findByRole("PSYCHOLOGIST"));
    }

    @PostMapping("/assign")
    @Transactional
    public ResponseEntity<?> assignPsychologist(@RequestBody AssignRequest body) {
        try {
            if (body == null || body.userId == null || body.psychologistId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Faltan userId o psychologistId"));
            }
            Long userId = body.userId;
            Long psychologistId = body.psychologistId;
            
            var userOpt = userRepository.findById(userId);
            var psychOpt = userRepository.findById(psychologistId);
            if (userOpt.isEmpty() || psychOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Usuario o psicólogo no existe"));
            }
            
            UserEntity user = userOpt.get();
            UserEntity psych = psychOpt.get();
            
            if (!"PSYCHOLOGIST".equals(psych.getRole())) {
                return ResponseEntity.badRequest().body(Map.of("error", "El destino no tiene rol PSYCHOLOGIST"));
            }
            
            if (!"USER".equals(user.getRole())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Solo se pueden asignar usuarios con rol USER"));
            }

            if (userId.equals(psychologistId)) {
                return ResponseEntity.badRequest().body(Map.of("error", "No puede asignarse a sí mismo"));
            }

            // Usar métodos del repositorio que tienen @Modifying con flushAutomatically = true
            // Eliminar relación existente si existe
            userPsychologistRepository.deleteByUserId(userId);
            
            // Insertar nueva relación
            int inserted = userPsychologistRepository.insertRelation(userId, psychologistId);
            
            if (inserted == 0) {
                return ResponseEntity.status(500).body(Map.of("error", "No se pudo insertar la relación"));
            }
            
            // Limpiar el caché de entidades para asegurar que la siguiente consulta lea de la BD
            entityManager.clear();
            
            // Verificar que se guardó correctamente usando el repositorio
            var verify = userPsychologistRepository.findByUserId(userId);
            if (verify.isEmpty()) {
                return ResponseEntity.status(500).body(Map.of("error", "La relación no se guardó correctamente"));
            }
            
            var saved = verify.get();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "userId", saved.getUserId(),
                "psychologistId", saved.getPsychologist().getId()
            ));
            
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            e.printStackTrace();
            String causeMsg = e.getMostSpecificCause() != null ? e.getMostSpecificCause().getMessage() : null;
            String errorMsg = causeMsg != null ? causeMsg : (e.getMessage() != null ? e.getMessage() : "Error de integridad");
            return ResponseEntity.status(409).body(Map.of("error", "Conflicto de integridad", "message", errorMsg));
        } catch (Exception e) {
            e.printStackTrace();
            String errorMsg = e.getMessage() != null ? e.getMessage() : "Error desconocido";
            String className = e.getClass().getSimpleName();
            return ResponseEntity.status(500).body(Map.of("error", className, "message", errorMsg, "type", e.getClass().getName()));
        }
    }

    @DeleteMapping("/assign/{userId}")
    @Transactional
    public ResponseEntity<?> unassignPsychologist(@PathVariable Long userId) {
        try {
            var userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Usuario no existe"));
            }
            
            UserEntity user = userOpt.get();
            if (!"USER".equals(user.getRole())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Solo se pueden desvincular usuarios con rol USER"));
            }

            // Eliminar relación existente
            int deleted = userPsychologistRepository.deleteByUserId(userId);
            
            // Limpiar el caché de entidades
            entityManager.clear();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "userId", userId,
                "deleted", deleted > 0
            ));
            
        } catch (Exception e) {
            e.printStackTrace();
            String errorMsg = e.getMessage() != null ? e.getMessage() : "Error desconocido";
            String className = e.getClass().getSimpleName();
            return ResponseEntity.status(500).body(Map.of("error", className, "message", errorMsg, "type", e.getClass().getName()));
        }
    }
}


