package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.DailyMoodEntryEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.service.DailyMoodService;
import com.alvaro.psicoapp.util.InputSanitizer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/personal-agenda")
public class PersonalAgendaController {
    @Autowired
    private DailyMoodService dailyMoodService;
    
    @Autowired
    private UserRepository userRepository;

    @PostMapping("/entry")
    public ResponseEntity<?> saveEntry(Principal principal, @RequestBody Map<String, Object> body) {
        try {
            // Obtener el usuario por email (principal.getName() devuelve el email)
            String userEmail = principal.getName();
            UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            Long userId = user.getId();
            
            // Validar que moodRating esté presente
            if (body.get("moodRating") == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "El estado de ánimo es obligatorio"));
            }
            
            // Convertir moodRating a Integer si viene como String o Number
            Object moodRatingObj = body.get("moodRating");
            Integer moodRating;
            try {
                if (moodRatingObj instanceof Integer) {
                    moodRating = (Integer) moodRatingObj;
                } else if (moodRatingObj instanceof Number) {
                    moodRating = ((Number) moodRatingObj).intValue();
                } else {
                    moodRating = Integer.valueOf(moodRatingObj.toString());
                }
                body.put("moodRating", moodRating);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Formato de estado de ánimo inválido: " + e.getMessage()));
            }
            
            // Sanitizar inputs
            if (body.get("notes") != null && !body.get("notes").toString().isEmpty()) {
                body.put("notes", InputSanitizer.sanitize(body.get("notes").toString()));
            } else {
                body.put("notes", null);
            }
            if (body.get("location") != null && !body.get("location").toString().isEmpty()) {
                body.put("location", InputSanitizer.sanitize(body.get("location").toString()));
            } else {
                body.put("location", null);
            }
            
            // Manejar arrays JSON - si vienen como string JSON, dejarlos como string
            // Si vienen como null, dejarlos como null
            if (body.get("emotions") != null && body.get("emotions").toString().trim().isEmpty()) {
                body.put("emotions", null);
            }
            if (body.get("activities") != null && body.get("activities").toString().trim().isEmpty()) {
                body.put("activities", null);
            }
            if (body.get("companions") != null && body.get("companions").toString().trim().isEmpty()) {
                body.put("companions", null);
            }
            
            DailyMoodEntryEntity entry = dailyMoodService.saveOrUpdate(userId, body);
            
            // Crear un mapa simple para la respuesta para evitar problemas de serialización
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            
            Map<String, Object> entryData = new HashMap<>();
            entryData.put("id", entry.getId());
            entryData.put("entryDate", entry.getEntryDate().toString());
            entryData.put("moodRating", entry.getMoodRating());
            entryData.put("emotions", entry.getEmotions() != null ? entry.getEmotions() : "");
            entryData.put("activities", entry.getActivities() != null ? entry.getActivities() : "");
            entryData.put("companions", entry.getCompanions() != null ? entry.getCompanions() : "");
            entryData.put("location", entry.getLocation() != null ? entry.getLocation() : "");
            entryData.put("notes", entry.getNotes() != null ? entry.getNotes() : "");
            
            responseData.put("entry", entryData);
            
            return ResponseEntity.ok(responseData);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            String errorMsg = e.getMessage() != null ? e.getMessage() : "Error al guardar la entrada";
            return ResponseEntity.badRequest().body(Map.of("error", errorMsg));
        }
    }

    @GetMapping("/entry/today")
    public ResponseEntity<?> getTodayEntry(Principal principal) {
        try {
            String userEmail = principal.getName();
            UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            Long userId = user.getId();
            Optional<DailyMoodEntryEntity> entry = dailyMoodService.getTodayEntry(userId);
            return ResponseEntity.ok(Map.of("entry", entry.orElse(null)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/entries")
    public ResponseEntity<?> getUserEntries(Principal principal) {
        try {
            String userEmail = principal.getName();
            UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            Long userId = user.getId();
            List<DailyMoodEntryEntity> entries = dailyMoodService.getUserEntries(userId);
            return ResponseEntity.ok(Map.of("entries", entries));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/statistics")
    public ResponseEntity<?> getStatistics(Principal principal, @RequestParam(defaultValue = "30") int days) {
        try {
            String userEmail = principal.getName();
            UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            Long userId = user.getId();
            Map<String, Object> stats = dailyMoodService.getStatistics(userId, days);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

