package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.AppointmentEntity;
import com.alvaro.psicoapp.repository.AppointmentRepository;
import com.alvaro.psicoapp.repository.DailyMoodEntryRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class ReminderScheduler {
    private static final Logger logger = LoggerFactory.getLogger(ReminderScheduler.class);

    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final DailyMoodEntryRepository dailyMoodEntryRepository;
    private final UserRepository userRepository;

    public ReminderScheduler(AppointmentRepository appointmentRepository,
                             NotificationService notificationService,
                             EmailService emailService,
                             DailyMoodEntryRepository dailyMoodEntryRepository,
                             UserRepository userRepository) {
        this.appointmentRepository = appointmentRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.dailyMoodEntryRepository = dailyMoodEntryRepository;
        this.userRepository = userRepository;
    }

    @Scheduled(cron = "0 0 * * * *")
    public void sendAppointmentReminders() {
        Instant now = Instant.now();
        Instant in24h = now.plus(24, ChronoUnit.HOURS);
        Instant in23h = now.plus(23, ChronoUnit.HOURS);

        List<AppointmentEntity> upcoming = appointmentRepository
                .findByStartTimeBetweenAndStatus(in23h, in24h, "CONFIRMED");

        for (AppointmentEntity apt : upcoming) {
            if (apt.getUser() != null) {
                notificationService.createNotification(apt.getUser().getId(), "REMINDER",
                        "Recordatorio de cita",
                        "Tienes una cita mañana con " + apt.getPsychologist().getName());

                try {
                    emailService.sendAppointmentReminderEmail(
                            apt.getUser().getEmail(), apt.getUser().getName(),
                            apt.getPsychologist().getName(), apt.getStartTime(),
                            apt.getEndTime(), apt.getPrice());
                } catch (Exception e) {
                    logger.error("Error enviando email de recordatorio", e);
                }
            }
        }
    }

    @Scheduled(cron = "0 0 9 * * *")
    public void sendMoodReminders() {
        LocalDate threeDaysAgo = LocalDate.now().minusDays(3);

        userRepository.findAll().forEach(user -> {
            if (!"USER".equals(user.getRole())) return;
            try {
                var recentEntry = dailyMoodEntryRepository.findByUser_IdAndEntryDate(user.getId(), threeDaysAgo);
                var todayEntry = dailyMoodEntryRepository.findByUser_IdAndEntryDate(user.getId(), LocalDate.now());
                if (recentEntry.isEmpty() && todayEntry.isEmpty()) {
                    notificationService.createNotification(user.getId(), "REMINDER",
                            "Diario de ánimo",
                            "No olvides registrar tu estado de ánimo hoy. Es importante para tu seguimiento.");
                }
            } catch (Exception e) {
                logger.debug("Error checking mood entries for user {}", user.getId());
            }
        });
    }
}
