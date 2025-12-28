package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.DailyMoodEntryEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.DailyMoodEntryRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DailyMoodService {
    @Autowired
    private DailyMoodEntryRepository dailyMoodEntryRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Transactional
    public DailyMoodEntryEntity saveOrUpdate(Long userId, Map<String, Object> data) {
        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        LocalDate entryDate = data.get("entryDate") != null 
            ? LocalDate.parse(data.get("entryDate").toString())
            : LocalDate.now();

        // Validar que la fecha esté dentro del rango permitido: hoy o máximo 2 días atrás
        LocalDate today = LocalDate.now();
        LocalDate minAllowedDate = today.minusDays(2);
        
        if (entryDate.isAfter(today)) {
            throw new RuntimeException("No se pueden crear entradas con fechas futuras. Solo se permiten entradas para hoy o máximo 2 días atrás.");
        }
        
        if (entryDate.isBefore(minAllowedDate)) {
            throw new RuntimeException("Solo se pueden crear entradas para hoy o máximo 2 días atrás. La fecha seleccionada es demasiado antigua.");
        }

        DailyMoodEntryEntity entry = dailyMoodEntryRepository
            .findByUser_IdAndEntryDate(userId, entryDate)
            .orElse(new DailyMoodEntryEntity());

        entry.setUser(user);
        entry.setEntryDate(entryDate);
        
        // Validar y establecer moodRating (obligatorio)
        Object moodRatingObj = data.get("moodRating");
        if (moodRatingObj == null) {
            throw new RuntimeException("El estado de ánimo es obligatorio");
        }
        
        Integer moodRating;
        if (moodRatingObj instanceof Integer) {
            moodRating = (Integer) moodRatingObj;
        } else if (moodRatingObj instanceof Number) {
            moodRating = ((Number) moodRatingObj).intValue();
        } else {
            try {
                moodRating = Integer.valueOf(moodRatingObj.toString());
            } catch (NumberFormatException e) {
                throw new RuntimeException("El estado de ánimo debe ser un número válido");
            }
        }
        
        if (moodRating < 1 || moodRating > 5) {
            throw new RuntimeException("El estado de ánimo debe estar entre 1 y 5");
        }
        entry.setMoodRating(moodRating);
        
        // Establecer campos opcionales
        if (data.get("emotions") != null && !data.get("emotions").toString().trim().isEmpty()) {
            entry.setEmotions(data.get("emotions").toString());
        }
        if (data.get("activities") != null && !data.get("activities").toString().trim().isEmpty()) {
            entry.setActivities(data.get("activities").toString());
        }
        if (data.get("companions") != null && !data.get("companions").toString().trim().isEmpty()) {
            entry.setCompanions(data.get("companions").toString());
        }
        if (data.get("location") != null && !data.get("location").toString().trim().isEmpty()) {
            entry.setLocation(data.get("location").toString());
        }
        if (data.get("notes") != null && !data.get("notes").toString().trim().isEmpty()) {
            entry.setNotes(data.get("notes").toString());
        }

        System.out.println("About to save entry with:");
        System.out.println("  moodRating: " + entry.getMoodRating());
        System.out.println("  entryDate: " + entry.getEntryDate());
        System.out.println("  emotions: " + entry.getEmotions());
        System.out.println("  activities: " + entry.getActivities());
        System.out.println("  companions: " + entry.getCompanions());
        System.out.println("  location: " + entry.getLocation());
        System.out.println("  notes: " + (entry.getNotes() != null ? entry.getNotes().substring(0, Math.min(50, entry.getNotes().length())) + "..." : "null"));

        try {
            DailyMoodEntryEntity saved = dailyMoodEntryRepository.save(entry);
            System.out.println("Entry saved successfully with ID: " + saved.getId());
            return saved;
        } catch (Exception e) {
            System.out.println("Error saving to database: " + e.getMessage());
            System.out.println("Exception class: " + e.getClass().getName());
            e.printStackTrace();
            throw new RuntimeException("Error al guardar en la base de datos: " + e.getMessage(), e);
        }
    }

    public Optional<DailyMoodEntryEntity> getTodayEntry(Long userId) {
        return dailyMoodEntryRepository.findByUser_IdAndEntryDate(userId, LocalDate.now());
    }

    public List<DailyMoodEntryEntity> getUserEntries(Long userId) {
        return dailyMoodEntryRepository.findByUser_IdOrderByEntryDateDesc(userId);
    }

    public List<DailyMoodEntryEntity> getUserEntriesBetween(Long userId, LocalDate start, LocalDate end) {
        return dailyMoodEntryRepository.findByUser_IdAndEntryDateBetween(userId, start, end);
    }

    public Map<String, Object> getStatistics(Long userId, int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);
        
        List<DailyMoodEntryEntity> entries = getUserEntriesBetween(userId, startDate, endDate);
        
        Map<String, Object> stats = new HashMap<>();
        
        if (entries.isEmpty()) {
            stats.put("averageMood", 0.0);
            stats.put("totalEntries", 0);
            stats.put("streak", 0);
            stats.put("mostCommonEmotions", List.of());
            stats.put("mostCommonActivities", List.of());
            return stats;
        }

        double averageMood = entries.stream()
            .mapToInt(e -> e.getMoodRating() != null ? e.getMoodRating() : 0)
            .average()
            .orElse(0.0);

        // Calcular racha (días consecutivos)
        int streak = calculateStreak(entries);

        stats.put("averageMood", averageMood);
        stats.put("totalEntries", entries.size());
        stats.put("streak", streak);
        stats.put("mostCommonEmotions", getMostCommon(entries, "emotions"));
        stats.put("mostCommonActivities", getMostCommon(entries, "activities"));
        
        return stats;
    }

    private int calculateStreak(List<DailyMoodEntryEntity> entries) {
        if (entries.isEmpty()) return 0;
        
        entries.sort((a, b) -> b.getEntryDate().compareTo(a.getEntryDate()));
        int streak = 0;
        LocalDate currentDate = LocalDate.now();
        
        for (DailyMoodEntryEntity entry : entries) {
            if (entry.getEntryDate().equals(currentDate) || 
                entry.getEntryDate().equals(currentDate.minusDays(streak))) {
                streak++;
                currentDate = entry.getEntryDate().minusDays(1);
            } else {
                break;
            }
        }
        
        return streak;
    }

    private List<String> getMostCommon(List<DailyMoodEntryEntity> entries, String field) {
        // Implementación simplificada - en producción usar un parser JSON adecuado
        return List.of(); // Placeholder
    }
}

