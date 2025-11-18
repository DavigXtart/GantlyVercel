package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.UserRepository;
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

@RestController
@RequestMapping("/api/profile")
public class UserProfileController {
    private final UserRepository userRepository;
    private final com.alvaro.psicoapp.repository.UserPsychologistRepository userPsychologistRepository;

    public UserProfileController(UserRepository userRepository, com.alvaro.psicoapp.repository.UserPsychologistRepository userPsychologistRepository) {
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
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
                ioException.printStackTrace();
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
            e.printStackTrace();
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


