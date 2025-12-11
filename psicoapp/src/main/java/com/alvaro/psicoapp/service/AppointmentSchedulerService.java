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
    
    private final AppointmentRepository appointmentRepository;
    private final EmailService emailService;
    
    public AppointmentSchedulerService(AppointmentRepository appointmentRepository, EmailService emailService) {
        this.appointmentRepository = appointmentRepository;
        this.emailService = emailService;
    }
    
    /**
     * Tarea programada que se ejecuta cada hora para marcar como expiradas
     * las citas confirmadas con plazo de pago vencido
     */
    @Scheduled(cron = "0 0 * * * ?") // Cada hora en el minuto 0
    @Transactional
    public void expireUnpaidAppointments() {
        logger.info("Iniciando verificación de pagos expirados...");
        
        Instant now = Instant.now();
        
        // Buscar citas confirmadas con payment_status = PENDING y payment_deadline < ahora
        List<AppointmentEntity> expiredAppointments = appointmentRepository
            .findByStatusAndPaymentStatusAndPaymentDeadlineBefore(
                "CONFIRMED", 
                "PENDING", 
                now
            );
        
        if (expiredAppointments.isEmpty()) {
            logger.info("No se encontraron citas con pagos expirados");
            return;
        }
        
        logger.info("Se encontraron {} citas con pagos expirados", expiredAppointments.size());
        
        int expiredCount = 0;
        for (AppointmentEntity appointment : expiredAppointments) {
            try {
                // Marcar como expirado
                appointment.setPaymentStatus("EXPIRED");
                appointment.setStatus("CANCELLED");
                appointmentRepository.save(appointment);
                expiredCount++;
                
                logger.info("Cita ID {} marcada como expirada y cancelada. Paciente: {}, Psicólogo: {}", 
                    appointment.getId(),
                    appointment.getUser() != null ? appointment.getUser().getEmail() : "N/A",
                    appointment.getPsychologist() != null ? appointment.getPsychologist().getEmail() : "N/A"
                );
            } catch (Exception e) {
                logger.error("Error al procesar cita expirada ID {}: {}", appointment.getId(), e.getMessage(), e);
            }
        }
        
        logger.info("Proceso completado. {} citas marcadas como expiradas", expiredCount);
    }
    
    /**
     * Tarea programada que se ejecuta cada hora para enviar recordatorios de citas
     * Envía recordatorios 24 horas antes y 1 hora antes de la cita
     */
    @Scheduled(cron = "0 0 * * * ?") // Cada hora en el minuto 0
    @Transactional(readOnly = true)
    public void sendAppointmentReminders() {
        logger.info("Iniciando envío de recordatorios de citas...");
        
        Instant now = Instant.now();
        Instant in24Hours = now.plusSeconds(24 * 60 * 60);
        Instant in1Hour = now.plusSeconds(60 * 60);
        
        // Buscar citas confirmadas que empiecen en las próximas 24 horas
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
                // Enviar recordatorio 24 horas antes
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
                
                // Enviar recordatorio 1 hora antes
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
    
    /**
     * Tarea programada que se ejecuta cada hora para enviar recordatorios de pago
     * Envía recordatorios cuando quedan 12 horas y 2 horas para el plazo de pago
     */
    @Scheduled(cron = "0 0 * * * ?") // Cada hora en el minuto 0
    @Transactional(readOnly = true)
    public void sendPaymentReminders() {
        logger.info("Iniciando envío de recordatorios de pago...");
        
        Instant now = Instant.now();
        Instant in12Hours = now.plusSeconds(12 * 60 * 60);
        Instant in2Hours = now.plusSeconds(2 * 60 * 60);
        
        // Buscar citas confirmadas con pago pendiente
        List<AppointmentEntity> unpaidAppointments = appointmentRepository
            .findByStatusAndPaymentStatus("CONFIRMED", "PENDING");
        
        int remindersSent = 0;
        for (AppointmentEntity appointment : unpaidAppointments) {
            if (appointment.getPaymentDeadline() == null || 
                appointment.getUser() == null || 
                appointment.getPsychologist() == null) {
                continue;
            }
            
            // Solo enviar si el plazo no ha expirado
            if (appointment.getPaymentDeadline().isBefore(now)) {
                continue;
            }
            
            Duration timeUntilDeadline = Duration.between(now, appointment.getPaymentDeadline());
            long hoursUntil = timeUntilDeadline.toHours();
            
            try {
                // Enviar recordatorio cuando quedan 12 horas
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
                
                // Enviar recordatorio cuando quedan 2 horas
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

