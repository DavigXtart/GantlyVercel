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
    @Transactional
    public ResponseEntity<Map<String, String>> uploadAvatar(Principal principal, @RequestParam("file") MultipartFile file) throws IOException {
        if (principal == null) return ResponseEntity.status(401).build();
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (file.isEmpty()) return ResponseEntity.badRequest().build();
        String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
        String name = UUID.randomUUID() + (ext != null ? ("." + ext) : "");
        File dir = new File("uploads/avatars");
        if (!dir.exists()) dir.mkdirs();
        File dest = new File(dir, name);
        file.transferTo(dest);
        String publicPath = "/uploads/avatars/" + name;
        user.setAvatarUrl(publicPath);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("avatarUrl", publicPath));
    }
}


