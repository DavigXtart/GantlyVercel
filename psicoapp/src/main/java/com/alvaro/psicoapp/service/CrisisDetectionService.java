package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.DailyMoodEntryEntity;
import com.alvaro.psicoapp.repository.DailyMoodEntryRepository;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class CrisisDetectionService {
    private static final Logger logger = LoggerFactory.getLogger(CrisisDetectionService.class);

    private final DailyMoodEntryRepository dailyMoodEntryRepository;
    private final UserPsychologistRepository userPsychologistRepository;
    private final NotificationService notificationService;

    private static final List<String> CRISIS_KEYWORDS = Arrays.asList(
            "no quiero seguir", "sin salida", "me quiero morir", "suicidarme",
            "no vale la pena", "mejor sin mi", "no puedo mas", "no puedo más",
            "acabar con todo", "desaparecer", "no tiene sentido"
    );

    private static final Pattern CRISIS_PATTERN = Pattern.compile(
            String.join("|", CRISIS_KEYWORDS), Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    public CrisisDetectionService(DailyMoodEntryRepository dailyMoodEntryRepository,
                                  UserPsychologistRepository userPsychologistRepository,
                                  NotificationService notificationService) {
        this.dailyMoodEntryRepository = dailyMoodEntryRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.notificationService = notificationService;
    }

    public void analyzeMoodTrend(Long userId) {
        try {
            LocalDate now = LocalDate.now();
            List<DailyMoodEntryEntity> recentEntries = dailyMoodEntryRepository
                    .findByUser_IdAndEntryDateBetween(userId, now.minusDays(7), now);

            if (recentEntries.isEmpty()) return;

            // Rule 1: Average mood <= 1.5 over last 7 days -> HIGH risk
            double avgMood = recentEntries.stream()
                    .filter(e -> e.getMoodRating() != null)
                    .mapToInt(DailyMoodEntryEntity::getMoodRating)
                    .average().orElse(3.0);

            if (avgMood <= 1.5 && recentEntries.size() >= 3) {
                triggerAlert(userId, "HIGH", "Estado de ánimo muy bajo sostenido (media: " + String.format("%.1f", avgMood) + "/5 en los últimos 7 días)");
                return;
            }

            // Rule 2: Mood dropped from >= 4 to <= 2 in 3 consecutive days -> MEDIUM risk
            recentEntries.sort((a, b) -> a.getEntryDate().compareTo(b.getEntryDate()));
            for (int i = 0; i < recentEntries.size() - 2; i++) {
                var e1 = recentEntries.get(i);
                var e2 = recentEntries.get(i + 1);
                var e3 = recentEntries.get(i + 2);
                if (e1.getMoodRating() != null && e1.getMoodRating() >= 4
                        && e3.getMoodRating() != null && e3.getMoodRating() <= 2) {
                    triggerAlert(userId, "MEDIUM", "Descenso brusco del estado de ánimo detectado");
                    return;
                }
            }

            // Rule 3: Keywords in notes -> HIGH risk
            for (DailyMoodEntryEntity entry : recentEntries) {
                String notes = entry.getNotes();
                if (notes != null && CRISIS_PATTERN.matcher(notes).find()) {
                    triggerAlert(userId, "HIGH", "Se han detectado expresiones de riesgo en las notas del diario");
                    return;
                }
            }
        } catch (Exception e) {
            logger.error("Error analizando tendencia de ánimo para usuario {}", userId, e);
        }
    }

    private void triggerAlert(Long userId, String level, String reason) {
        logger.warn("CRISIS ALERT [{}] for user {}: {}", level, userId, reason);

        var rel = userPsychologistRepository.findByUserId(userId);
        if (rel.isPresent()) {
            Long psychId = rel.get().getPsychologist().getId();
            String type = "HIGH".equals(level) ? "CRISIS" : "WARNING";
            notificationService.createNotification(psychId, type,
                    "HIGH".equals(level) ? "Alerta de crisis - Paciente" : "Alerta - Paciente",
                    reason);
        }

        if ("HIGH".equals(level)) {
            notificationService.createNotification(userId, "CRISIS",
                    "Recursos de ayuda",
                    "Si necesitas ayuda inmediata, llama al 024 (Línea de atención a la conducta suicida) o al 112 (Emergencias).");
        }
    }
}
