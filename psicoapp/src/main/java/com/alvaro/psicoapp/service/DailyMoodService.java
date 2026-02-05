package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.DailyMoodEntryEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.DailyMoodDtos;
import com.alvaro.psicoapp.repository.DailyMoodEntryRepository;
import com.alvaro.psicoapp.util.InputSanitizer;
import com.alvaro.psicoapp.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DailyMoodService {
    private static final Logger logger = LoggerFactory.getLogger(DailyMoodService.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    @Autowired
    private DailyMoodEntryRepository dailyMoodEntryRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Transactional
    public DailyMoodEntryEntity saveOrUpdate(Long userId, DailyMoodDtos.SaveEntryRequest req) {
        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        LocalDate entryDate = req.entryDate() != null ? req.entryDate() : LocalDate.now();

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
        
        if (req.moodRating() == null) {
            throw new RuntimeException("El estado de ánimo es obligatorio");
        }
        if (req.moodRating() < 1 || req.moodRating() > 5) {
            throw new RuntimeException("El estado de ánimo debe estar entre 1 y 5");
        }
        entry.setMoodRating(req.moodRating());
        
        if (req.emotions() != null && !req.emotions().trim().isEmpty()) entry.setEmotions(req.emotions());
        if (req.activities() != null && !req.activities().trim().isEmpty()) entry.setActivities(req.activities());
        if (req.companions() != null && !req.companions().trim().isEmpty()) entry.setCompanions(req.companions());
        if (req.location() != null && !req.location().trim().isEmpty()) entry.setLocation(InputSanitizer.sanitize(req.location()));
        if (req.notes() != null && !req.notes().trim().isEmpty()) entry.setNotes(InputSanitizer.sanitize(req.notes()));

        try {
            DailyMoodEntryEntity saved = dailyMoodEntryRepository.save(entry);
            return saved;
        } catch (Exception e) {
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

    public DailyMoodDtos.MoodStatisticsResponse getStatistics(Long userId, int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);
        List<DailyMoodEntryEntity> entries = getUserEntriesBetween(userId, startDate, endDate);
        
        if (entries.isEmpty()) {
            return new DailyMoodDtos.MoodStatisticsResponse(0.0, 0, 0, List.of(), List.of());
        }
        double averageMood = entries.stream()
            .mapToInt(e -> e.getMoodRating() != null ? e.getMoodRating() : 0)
            .average()
            .orElse(0.0);
        int streak = calculateStreak(entries);
        return new DailyMoodDtos.MoodStatisticsResponse(averageMood, entries.size(), streak,
                getMostCommon(entries, "emotions"), getMostCommon(entries, "activities"));
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
        Map<String, Integer> frequencyMap = new HashMap<>();
        
        for (DailyMoodEntryEntity entry : entries) {
            String jsonString = null;
            switch (field) {
                case "emotions":
                    jsonString = entry.getEmotions();
                    break;
                case "activities":
                    jsonString = entry.getActivities();
                    break;
                case "companions":
                    jsonString = entry.getCompanions();
                    break;
            }
            
            if (jsonString == null || jsonString.trim().isEmpty()) {
                continue;
            }
            
            try {
                List<String> items = objectMapper.readValue(jsonString, new TypeReference<List<String>>() {});
                for (String item : items) {
                    if (item != null && !item.trim().isEmpty()) {
                        frequencyMap.put(item.trim(), frequencyMap.getOrDefault(item.trim(), 0) + 1);
                    }
                }
            } catch (Exception e) {
                logger.debug("Error parseando JSON para campo '{}': {}", field, e.getMessage());
            }
        }
        
        // Retornar los 5 más comunes, ordenados por frecuencia descendente
        return frequencyMap.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(5)
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());
    }
}

