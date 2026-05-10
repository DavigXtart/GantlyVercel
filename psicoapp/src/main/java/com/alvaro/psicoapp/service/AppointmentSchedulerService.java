package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.AppointmentEntity;
import com.alvaro.psicoapp.repository.AppointmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Duration;
import java.util.List;

@Service
public class AppointmentSchedulerService {
    private static final Logger logger = LoggerFactory.getLogger(AppointmentSchedulerService.class);
    private static final long PAYMENT_DEADLINE_HOURS = 48;

    private final AppointmentRepository appointmentRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    public AppointmentSchedulerService(AppointmentRepository appointmentRepository,
                                       EmailService emailService,
                                       NotificationService notificationService) {
        this.appointmentRepository = appointmentRepository;
        this.emailService = emailService;
        this.notificationService = notificationService;
    }

    @Scheduled(fixedRate = 900000) // Every 15 minutes
    @Transactional
    public void expireUnpaidAppointments() {
        logger.info("Iniciando verificación de pagos expirados...");

        Instant now = Instant.now();

        // 1. Appointments with explicit paymentDeadline that has passed
        List<AppointmentEntity> expiredConfirmed = appointmentRepository
            .findByStatusAndPaymentStatusAndPaymentDeadlineBefore("CONFIRMED", "PENDING", now);
        List<AppointmentEntity> expiredBooked = appointmentRepository
            .findByStatusAndPaymentStatusAndPaymentDeadlineBefore("BOOKED", "PENDING", now);

        List<AppointmentEntity> expiredAppointments = new java.util.ArrayList<>(expiredConfirmed);
        expiredAppointments.addAll(expiredBooked);

        // 2. Fallback: appointments without paymentDeadline but created > 48h ago and still unpaid
        Instant cutoff48h = now.minus(Duration.ofHours(PAYMENT_DEADLINE_HOURS));
        List<AppointmentEntity> expiredWithoutDeadline = appointmentRepository.findExpiredUnpaidWithoutDeadline(cutoff48h);
        expiredAppointments.addAll(expiredWithoutDeadline);

        if (expiredAppointments.isEmpty()) {
            logger.info("No se encontraron citas con pagos expirados");
            return;
        }

        logger.info("Se encontraron {} citas con pagos expirados", expiredAppointments.size());

        int expiredCount = 0;
        for (AppointmentEntity appointment : expiredAppointments) {
            try {
                // Notify patient before releasing the slot
                if (appointment.getUser() != null) {
                    notificationService.createNotification(appointment.getUser().getId(), "PAYMENT",
                        "Cita expirada por falta de pago",
                        "Tu cita con " + (appointment.getPsychologist() != null ? appointment.getPsychologist().getName() : "tu psicólogo")
                            + " ha sido liberada por no completar el pago a tiempo.");
                }

                appointment.setStatus("FREE");
                appointment.setPaymentStatus(null);
                appointment.setUser(null);
                appointment.setStripeSessionId(null);
                appointment.setConfirmedAt(null);
                appointment.setConfirmedByUser(null);
                appointment.setPaymentDeadline(null);
                appointmentRepository.save(appointment);
                expiredCount++;

                logger.info("Cita ID {} liberada por pago expirado. Psicólogo: {}",
                    appointment.getId(),
                    appointment.getPsychologist() != null ? appointment.getPsychologist().getEmail() : "N/A"
                );
            } catch (Exception e) {
                logger.error("Error al procesar cita expirada ID {}: {}", appointment.getId(), e.getMessage(), e);
            }
        }

        logger.info("Proceso completado. {} citas liberadas por pago expirado", expiredCount);
    }

    @Scheduled(cron = "0 0 * * * ?")
    @Transactional(readOnly = true)
    public void sendAppointmentReminders() {
        logger.info("Iniciando envío de recordatorios de citas...");

        Instant now = Instant.now();
        Instant in24Hours = now.plusSeconds(24 * 60 * 60);
        Instant in1Hour = now.plusSeconds(60 * 60);

        List<AppointmentEntity> upcomingAppointments = appointmentRepository
            .findByStatusAndStartTimeBetween("CONFIRMED", now, in24Hours);

        int remindersSent = 0;
        for (AppointmentEntity appointment : upcomingAppointments) {
            if (appointment.getUser() == null || appointment.getPsychologist() == null) {
                continue;
            }

            Duration timeUntilAppointment = Duration.between(now, appointment.getStartTime());
            long hoursUntil = timeUntilAppointment.toHours();

            try {

                if (hoursUntil >= 23 && hoursUntil <= 25) {
                    emailService.sendAppointmentReminderEmail(
                        appointment.getUser().getEmail(),
                        appointment.getUser().getName(),
                        appointment.getPsychologist().getName(),
                        appointment.getStartTime(),
                        appointment.getEndTime(),
                        appointment.getPrice()
                    );
                    remindersSent++;
                    logger.info("Recordatorio de 24h enviado para cita ID {} - Paciente: {}",
                        appointment.getId(), appointment.getUser().getEmail());
                }

                if (hoursUntil >= 0 && hoursUntil <= 1) {
                    emailService.sendAppointmentReminderEmail(
                        appointment.getUser().getEmail(),
                        appointment.getUser().getName(),
                        appointment.getPsychologist().getName(),
                        appointment.getStartTime(),
                        appointment.getEndTime(),
                        appointment.getPrice()
                    );
                    remindersSent++;
                    logger.info("Recordatorio de 1h enviado para cita ID {} - Paciente: {}",
                        appointment.getId(), appointment.getUser().getEmail());
                }
            } catch (Exception e) {
                logger.error("Error enviando recordatorio para cita ID {}: {}",
                    appointment.getId(), e.getMessage(), e);
            }
        }

        logger.info("Proceso de recordatorios completado. {} recordatorios enviados", remindersSent);
    }

    @Scheduled(cron = "0 0 * * * ?")
    @Transactional(readOnly = true)
    public void sendPaymentReminders() {
        logger.info("Iniciando envío de recordatorios de pago...");

        Instant now = Instant.now();
        Instant in12Hours = now.plusSeconds(12 * 60 * 60);
        Instant in2Hours = now.plusSeconds(2 * 60 * 60);

        List<AppointmentEntity> unpaidAppointments = appointmentRepository
            .findByStatusAndPaymentStatus("CONFIRMED", "PENDING");

        int remindersSent = 0;
        for (AppointmentEntity appointment : unpaidAppointments) {
            if (appointment.getPaymentDeadline() == null ||
                appointment.getUser() == null ||
                appointment.getPsychologist() == null) {
                continue;
            }

            if (appointment.getPaymentDeadline().isBefore(now)) {
                continue;
            }

            Duration timeUntilDeadline = Duration.between(now, appointment.getPaymentDeadline());
            long hoursUntil = timeUntilDeadline.toHours();

            try {

                if (hoursUntil >= 11 && hoursUntil <= 13) {
                    emailService.sendPaymentReminderEmail(
                        appointment.getUser().getEmail(),
                        appointment.getUser().getName(),
                        appointment.getPsychologist().getName(),
                        appointment.getStartTime(),
                        appointment.getPaymentDeadline(),
                        appointment.getPrice()
                    );
                    remindersSent++;
                    logger.info("Recordatorio de pago (12h) enviado para cita ID {} - Paciente: {}",
                        appointment.getId(), appointment.getUser().getEmail());
                }

                if (hoursUntil >= 1 && hoursUntil <= 3) {
                    emailService.sendPaymentReminderEmail(
                        appointment.getUser().getEmail(),
                        appointment.getUser().getName(),
                        appointment.getPsychologist().getName(),
                        appointment.getStartTime(),
                        appointment.getPaymentDeadline(),
                        appointment.getPrice()
                    );
                    remindersSent++;
                    logger.info("Recordatorio de pago (2h) enviado para cita ID {} - Paciente: {}",
                        appointment.getId(), appointment.getUser().getEmail());
                }
            } catch (Exception e) {
                logger.error("Error enviando recordatorio de pago para cita ID {}: {}",
                    appointment.getId(), e.getMessage(), e);
            }
        }

        logger.info("Proceso de recordatorios de pago completado. {} recordatorios enviados", remindersSent);
    }
}
