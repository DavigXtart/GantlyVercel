package com.alvaro.psicoapp.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.base.url:http://localhost:5173}")
    private String baseUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter
        .ofPattern("dd/MM/yyyy 'a las' HH:mm")
        .withZone(ZoneId.systemDefault());

    public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    public void sendVerificationEmail(String toEmail, String name, String verificationToken, String verificationCode, boolean isPsychologist) {
        try {
            String verificationUrl = baseUrl + "/verify-email?token=" + verificationToken;

            String greeting = isPsychologist
                ? "Gracias por unirte a PSYmatch como profesional de la psicología."
                : "Gracias por registrarte en PSYmatch.";

            String extraMessage = isPsychologist
                ? "Una vez verificado tu correo, podrás comenzar a gestionar tu práctica profesional y recibir pacientes."
                : "Si no creaste una cuenta en PSYmatch, puedes ignorar este correo.";

            Context ctx = new Context();
            ctx.setVariable("name", name);
            ctx.setVariable("greeting", greeting);
            ctx.setVariable("verificationUrl", verificationUrl);
            ctx.setVariable("verificationCode", verificationCode);
            ctx.setVariable("extraMessage", extraMessage);

            String html = templateEngine.process("email/verification", ctx);
            sendHtmlEmail(toEmail, "Verifica tu cuenta - PSYmatch", html);
        } catch (Exception e) {
            logger.error("Error enviando correo de verificación", e);
            throw new RuntimeException("Error al enviar el correo de verificación", e);
        }
    }

    public void sendAppointmentConfirmationEmail(String toEmail, String patientName, String psychologistName,
                                                 Instant appointmentStart, Instant paymentDeadline,
                                                 BigDecimal price) {
        try {
            Context ctx = new Context();
            ctx.setVariable("patientName", patientName);
            ctx.setVariable("psychologistName", psychologistName);
            ctx.setVariable("appointmentDate", DATE_FORMATTER.format(appointmentStart));
            ctx.setVariable("price", price != null ? String.format("%.2f", price.doubleValue()) : "0.00");
            ctx.setVariable("paymentDeadline", paymentDeadline);
            if (paymentDeadline != null) {
                ctx.setVariable("deadlineDate", DATE_FORMATTER.format(paymentDeadline));
            }

            String html = templateEngine.process("email/appointment-confirmation", ctx);
            sendHtmlEmail(toEmail, "Cita confirmada - PSYmatch", html);
        } catch (Exception e) {
            logger.error("Error enviando correo de confirmación de cita", e);
        }
    }

    public void sendAppointmentReminderEmail(String toEmail, String patientName, String psychologistName,
                                             Instant appointmentStart, Instant appointmentEnd,
                                             BigDecimal price) {
        try {
            Context ctx = new Context();
            ctx.setVariable("patientName", patientName);
            ctx.setVariable("psychologistName", psychologistName);
            ctx.setVariable("appointmentDate", DATE_FORMATTER.format(appointmentStart));
            ctx.setVariable("appointmentEndTime", DATE_FORMATTER.format(appointmentEnd));
            ctx.setVariable("price", price != null ? String.format("%.2f", price.doubleValue()) : "0.00");

            String html = templateEngine.process("email/appointment-reminder", ctx);
            sendHtmlEmail(toEmail, "Recordatorio de cita - PSYmatch", html);
        } catch (Exception e) {
            logger.error("Error enviando correo de recordatorio", e);
        }
    }

    public void sendPaymentReminderEmail(String toEmail, String patientName, String psychologistName,
                                        Instant appointmentStart, Instant paymentDeadline,
                                        BigDecimal price) {
        try {
            Duration timeUntilDeadline = Duration.between(Instant.now(), paymentDeadline);
            long hoursRemaining = timeUntilDeadline.toHours();

            String urgencyMessage = hoursRemaining < 6 ? "URGENTE: "
                : hoursRemaining < 24 ? "IMPORTANTE: " : "";

            Context ctx = new Context();
            ctx.setVariable("patientName", patientName);
            ctx.setVariable("urgencyMessage", urgencyMessage);
            ctx.setVariable("psychologistName", psychologistName);
            ctx.setVariable("appointmentDate", DATE_FORMATTER.format(appointmentStart));
            ctx.setVariable("price", price != null ? String.format("%.2f", price.doubleValue()) : "0.00");
            ctx.setVariable("deadlineDate", DATE_FORMATTER.format(paymentDeadline));
            ctx.setVariable("hoursRemaining", hoursRemaining);

            String html = templateEngine.process("email/payment-reminder", ctx);
            sendHtmlEmail(toEmail, "Recordatorio de pago - PSYmatch", html);
        } catch (Exception e) {
            logger.error("Error enviando correo de recordatorio de pago", e);
        }
    }

    public void sendPasswordResetEmail(String toEmail, String name, String resetToken) {
        try {
            String resetUrl = baseUrl + "/reset-password?token=" + resetToken;

            Context ctx = new Context();
            ctx.setVariable("name", name);
            ctx.setVariable("resetUrl", resetUrl);

            String html = templateEngine.process("email/password-reset", ctx);
            sendHtmlEmail(toEmail, "Recuperación de contraseña - PSYmatch", html);
        } catch (Exception e) {
            logger.error("Error enviando correo de recuperación de contraseña", e);
            throw new RuntimeException("Error al enviar el correo de recuperación de contraseña", e);
        }
    }

    public void resendVerificationEmail(String toEmail, String name, String verificationToken, String verificationCode, boolean isPsychologist) {
        sendVerificationEmail(toEmail, name, verificationToken, verificationCode, isPsychologist);
    }

    public void sendPsychologistApprovalEmail(String toEmail, String name) {
        try {
            Context ctx = new Context();
            ctx.setVariable("name", name);
            ctx.setVariable("loginUrl", baseUrl + "/login");

            String html = templateEngine.process("email/psychologist-approval", ctx);
            sendHtmlEmail(toEmail, "Cuenta aprobada - PSYmatch", html);
        } catch (Exception e) {
            logger.error("Error enviando correo de aprobación de psicólogo", e);
        }
    }

    public void sendPsychologistRejectionEmail(String toEmail, String name, String reason) {
        try {
            Context ctx = new Context();
            ctx.setVariable("name", name);
            ctx.setVariable("reason", reason != null ? reason : "No se proporcionó un motivo específico");

            String html = templateEngine.process("email/psychologist-rejection", ctx);
            sendHtmlEmail(toEmail, "Solicitud de cuenta - PSYmatch", html);
        } catch (Exception e) {
            logger.error("Error enviando correo de rechazo de psicólogo", e);
        }
    }

    public void sendAppointmentCancellationEmail(String toEmail, String patientName,
                                                  String psychologistName, Instant appointmentStart) {
        try {
            Context ctx = new Context();
            ctx.setVariable("patientName", patientName);
            ctx.setVariable("psychologistName", psychologistName);
            ctx.setVariable("appointmentDate", DATE_FORMATTER.format(appointmentStart));

            String html = templateEngine.process("email/appointment-cancellation", ctx);
            sendHtmlEmail(toEmail, "Cita cancelada - PSYmatch", html);
        } catch (Exception e) {
            logger.error("Error enviando correo de cancelación de cita", e);
        }
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        mailSender.send(message);
    }
}
