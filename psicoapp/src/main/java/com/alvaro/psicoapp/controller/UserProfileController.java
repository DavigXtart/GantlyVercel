package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.domain.UserPsychologistEntity;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.repository.PsychologistProfileRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.security.Principal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.Optional;

@RestController
@RequestMapping("/api/profile")
public class UserProfileController {
    private final UserRepository userRepository;
    private final com.alvaro.psicoapp.repository.UserPsychologistRepository userPsychologistRepository;
    private final PsychologistProfileRepository psychologistProfileRepository;

    public UserProfileController(UserRepository userRepository, com.alvaro.psicoapp.repository.UserPsychologistRepository userPsychologistRepository, PsychologistProfileRepository psychologistProfileRepository) {
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.psychologistProfileRepository = psychologistProfileRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getMe(Principal principal) {
        Map<String, Object> res = new HashMap<>();
        if (principal == null) return ResponseEntity.ok(res);
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        res.put("id", user.getId());
        res.put("name", user.getName());
        res.put("email", user.getEmail());
        res.put("role", user.getRole());
        res.put("avatarUrl", user.getAvatarUrl());
        res.put("darkMode", user.getDarkMode());
        res.put("gender", user.getGender());
        res.put("age", user.getAge());
        res.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/my-psychologist")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> myPsychologist(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        var rel = userPsychologistRepository.findByUserId(user.getId());
        if (rel.isEmpty()) return ResponseEntity.ok(Map.of("status", "PENDING"));
        var p = rel.get().getPsychologist();
        Map<String, Object> res = new HashMap<>();
        res.put("status", "ASSIGNED");
        res.put("psychologist", Map.of(
            "id", p.getId(),
            "name", p.getName(),
            "email", p.getEmail(),
            "avatarUrl", p.getAvatarUrl() != null ? p.getAvatarUrl() : ""
        ));
        return ResponseEntity.ok(res);
    }

    // POST: Seleccionar psicólogo (para usuarios sin psicólogo asignado)
    @PostMapping("/select-psychologist")
    @Transactional
    public ResponseEntity<?> selectPsychologist(Principal principal, @RequestBody Map<String, Object> body) {
        try {
            if (principal == null) return ResponseEntity.status(401).build();
            var user = userRepository.findByEmail(principal.getName()).orElseThrow();
            
            // Verificar que el usuario no tiene ya un psicólogo asignado
            var existingRel = userPsychologistRepository.findByUserId(user.getId());
            if (existingRel.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ya tienes un psicólogo asignado"));
            }
            
            // Obtener el ID del psicólogo del body
            Object psychologistIdObj = body.get("psychologistId");
            if (psychologistIdObj == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "No se proporcionó el ID del psicólogo"));
            }
            
            Long psychologistId;
            if (psychologistIdObj instanceof Number) {
                psychologistId = ((Number) psychologistIdObj).longValue();
            } else {
                psychologistId = Long.valueOf(psychologistIdObj.toString());
            }
            
            var psychologist = userRepository.findById(psychologistId)
                .orElseThrow(() -> new RuntimeException("Psicólogo no encontrado"));
            
            if (!"PSYCHOLOGIST".equals(psychologist.getRole())) {
                return ResponseEntity.badRequest().body(Map.of("error", "El usuario seleccionado no es un psicólogo"));
            }
            
            // Crear la relación usando SQL nativo (más confiable con @MapsId)
            // Verificar que ambos usuarios tienen IDs válidos
            if (user.getId() == null) {
                return ResponseEntity.status(500).body(Map.of("error", "El usuario no tiene un ID válido"));
            }
            if (psychologist.getId() == null) {
                return ResponseEntity.status(500).body(Map.of("error", "El psicólogo no tiene un ID válido"));
            }
            
            // Usar el método insertRelation que usa SQL nativo (más confiable)
            int rowsAffected = userPsychologistRepository.insertRelation(user.getId(), psychologist.getId());
            if (rowsAffected == 0) {
                return ResponseEntity.status(500).body(Map.of("error", "No se pudo crear la relación"));
            }
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Psicólogo seleccionado correctamente"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error al seleccionar psicólogo: " + e.getMessage()));
        }
    }

    // GET: Obtener perfil completo del psicólogo asignado
    @GetMapping("/psychologist/{psychologistId}")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getPsychologistProfile(Principal principal, @PathVariable Long psychologistId) {
        if (principal == null) return ResponseEntity.status(401).build();
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        
        var psychologist = userRepository.findById(psychologistId).orElseThrow();
        if (!"PSYCHOLOGIST".equals(psychologist.getRole())) {
            return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
        }
        
        // Permitir acceso si el psicólogo está asignado al usuario O si el usuario es USER (para matching)
        // Si es USER, permitir ver el perfil (útil para matching antes de seleccionar)
        if ("USER".equals(user.getRole())) {
            // Permitir acceso a usuarios para ver perfiles en el contexto del matching
            // No requiere que el psicólogo esté asignado
        } else {
            // Para otros roles (PSYCHOLOGIST, ADMIN), verificar asignación
            var rel = userPsychologistRepository.findByUserId(user.getId());
            if (rel.isEmpty() || !rel.get().getPsychologist().getId().equals(psychologistId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Este psicólogo no está asignado a tu cuenta"));
            }
        }
        
        var profileOpt = psychologistProfileRepository.findByUser_Id(psychologistId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", psychologist.getId());
        response.put("name", psychologist.getName());
        response.put("email", psychologist.getEmail());
        response.put("avatarUrl", psychologist.getAvatarUrl());
        response.put("gender", psychologist.getGender());
        response.put("age", psychologist.getAge());
        
        if (profileOpt.isPresent()) {
            var profile = profileOpt.get();
            response.put("bio", profile.getBio());
            response.put("education", profile.getEducation());
            response.put("certifications", profile.getCertifications());
            response.put("interests", profile.getInterests());
            response.put("specializations", profile.getSpecializations());
            response.put("experience", profile.getExperience());
            response.put("languages", profile.getLanguages());
            response.put("linkedinUrl", profile.getLinkedinUrl());
            response.put("website", profile.getWebsite());
            response.put("updatedAt", profile.getUpdatedAt());
        } else {
            // Perfil vacío si no existe
            response.put("bio", null);
            response.put("education", null);
            response.put("certifications", null);
            response.put("interests", null);
            response.put("specializations", null);
            response.put("experience", null);
            response.put("languages", null);
            response.put("linkedinUrl", null);
            response.put("website", null);
            response.put("updatedAt", null);
        }
        
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @Transactional
    public ResponseEntity<Void> updateProfile(Principal principal, @RequestBody Map<String, Object> body) {
        if (principal == null) return ResponseEntity.status(401).build();
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (body.containsKey("name")) user.setName(String.valueOf(body.get("name")));
        if (body.containsKey("darkMode")) user.setDarkMode(Boolean.valueOf(String.valueOf(body.get("darkMode"))));
        if (body.containsKey("gender")) user.setGender(String.valueOf(body.get("gender")));
        if (body.containsKey("age")) {
            Object ageObj = body.get("age");
            if (ageObj != null) {
                user.setAge(Integer.valueOf(ageObj.toString()));
            }
        }
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/avatar")
    public ResponseEntity<?> uploadAvatar(Principal principal, @RequestParam("file") MultipartFile file) {
        try {
            if (principal == null) return ResponseEntity.status(401).build();
            var user = userRepository.findByEmail(principal.getName()).orElseThrow();
            if (file.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "El archivo está vacío");
                return ResponseEntity.badRequest().body(error);
            }
            if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Solo se permiten archivos de imagen");
                return ResponseEntity.badRequest().body(error);
            }
            // Crear directorio si no existe
            File uploadsDir = new File("uploads");
            if (!uploadsDir.exists()) {
                boolean created = uploadsDir.mkdirs();
                if (!created) {
                    Map<String, String> error = new HashMap<>();
                    error.put("error", "No se pudo crear el directorio uploads");
                    error.put("path", uploadsDir.getAbsolutePath());
                    return ResponseEntity.status(500).body(error);
                }
            }
            
            File dir = new File(uploadsDir, "avatars");
            if (!dir.exists()) {
                boolean created = dir.mkdirs();
                if (!created || !dir.exists()) {
                    Map<String, String> error = new HashMap<>();
                    error.put("error", "No se pudo crear el directorio uploads/avatars");
                    error.put("path", dir.getAbsolutePath());
                    return ResponseEntity.status(500).body(error);
                }
            }
            
            // Verificar que el directorio es accesible
            if (!dir.canWrite()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "No se tienen permisos de escritura en el directorio");
                error.put("path", dir.getAbsolutePath());
                return ResponseEntity.status(500).body(error);
            }
            
            // Generar nombre único para el archivo
            String originalFilename = file.getOriginalFilename();
            String ext = StringUtils.getFilenameExtension(originalFilename);
            String name = UUID.randomUUID() + (ext != null ? ("." + ext) : "");
            File dest = new File(dir, name);
            
            // Guardar archivo en disco (usar Files.copy para mayor compatibilidad)
            File absoluteDest = dest.getAbsoluteFile();
            try {
                // Asegurarse de que el directorio padre existe
                File parentDir = absoluteDest.getParentFile();
                if (parentDir != null && !parentDir.exists()) {
                    boolean created = parentDir.mkdirs();
                    if (!created && !parentDir.exists()) {
                        Map<String, String> error = new HashMap<>();
                        error.put("error", "No se pudo crear el directorio padre");
                        error.put("path", parentDir.getAbsolutePath());
                        return ResponseEntity.status(500).body(error);
                    }
                }
                
                // Usar Files.copy en lugar de transferTo para mayor compatibilidad
                Files.copy(file.getInputStream(), absoluteDest.toPath(), StandardCopyOption.REPLACE_EXISTING);
                
                // Verificar que el archivo se creó correctamente
                if (!absoluteDest.exists() || !absoluteDest.canRead()) {
                    Map<String, String> error = new HashMap<>();
                    error.put("error", "El archivo no se guardó correctamente");
                    error.put("path", absoluteDest.getAbsolutePath());
                    return ResponseEntity.status(500).body(error);
                }
            } catch (IOException ioException) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Error al escribir el archivo: " + ioException.getMessage());
                error.put("path", absoluteDest.getAbsolutePath());
                error.put("details", "IOException");
                error.put("exception", ioException.getClass().getSimpleName());
                if (ioException.getCause() != null) {
                    error.put("cause", ioException.getCause().getMessage());
                }
                return ResponseEntity.status(500).body(error);
            }
            String publicPath = "/uploads/avatars/" + name;
            user.setAvatarUrl(publicPath);
            userRepository.save(user);
            Map<String, String> response = new HashMap<>();
            response.put("avatarUrl", publicPath);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Error inesperado: " + e.getMessage());
            error.put("details", e.getClass().getSimpleName());
            if (e.getCause() != null) {
                error.put("cause", e.getCause().getMessage());
            }
            return ResponseEntity.status(500).body(error);
        }
    }
}


