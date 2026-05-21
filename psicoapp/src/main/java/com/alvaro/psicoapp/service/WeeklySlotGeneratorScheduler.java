package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.dto.WeeklyScheduleDtos.GenerateResult;
import com.alvaro.psicoapp.repository.WeeklyScheduleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WeeklySlotGeneratorScheduler {
    private static final Logger logger = LoggerFactory.getLogger(WeeklySlotGeneratorScheduler.class);

    private final WeeklyScheduleService weeklyScheduleService;
    private final WeeklyScheduleRepository weeklyScheduleRepository;

    public WeeklySlotGeneratorScheduler(WeeklyScheduleService weeklyScheduleService,
                                         WeeklyScheduleRepository weeklyScheduleRepository) {
        this.weeklyScheduleService = weeklyScheduleService;
        this.weeklyScheduleRepository = weeklyScheduleRepository;
    }

    /**
     * Runs every Sunday at 2AM (Europe/Madrid).
     * Generates FREE appointment slots for the next 2 weeks
     * based on each psychologist's weekly schedule.
     */
    @Scheduled(cron = "0 0 2 * * SUN")
    public void generateWeeklySlots() {
        logger.info("Starting weekly slot generation...");

        List<Long> psychologistIds = weeklyScheduleRepository.findDistinctPsychologistIdsWithEnabledSchedule();

        if (psychologistIds.isEmpty()) {
            logger.info("No psychologists with enabled weekly schedules found");
            return;
        }

        int totalCreated = 0;
        int totalSkipped = 0;
        int errors = 0;

        for (Long psychId : psychologistIds) {
            try {
                GenerateResult result = weeklyScheduleService.generateSlots(psychId, 2);
                totalCreated += result.slotsCreated();
                totalSkipped += result.slotsSkipped();
                logger.info("Psychologist {}: {} created, {} skipped", psychId, result.slotsCreated(), result.slotsSkipped());
            } catch (Exception e) {
                errors++;
                logger.error("Error generating slots for psychologist {}: {}", psychId, e.getMessage(), e);
            }
        }

        logger.info("Weekly slot generation completed: {} psychologists processed, {} slots created, {} skipped, {} errors",
                psychologistIds.size(), totalCreated, totalSkipped, errors);
    }
}
