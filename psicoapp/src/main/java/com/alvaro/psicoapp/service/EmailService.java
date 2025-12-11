package com.alvaro.psicoapp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private final JavaMailSender mailSender;
    
    @Value("${app.base.url:http://localhost:5173}")
    private String baseUrl;
    
    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String toEmail, String name, String verificationToken) {
        sendVerificationEmail(toEmail, name, verificationToken, false);
    }

    public void sendVerificationEmail(String toEmail, String name, String verificationToken, boolean isPsychologist) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Verifica tu cuenta - PSYmatch");
            
            String verificationUrl = baseUrl + "/verify-email?token=" + verificationToken;
            
            String greeting = isPsychologist 
                ? "Gracias por unirte a PSYmatch como profesional de la psicología."
                : "Gracias por registrarte en PSYmatch.";
            
            String emailBody = String.format(
                "Hola %s,\n\n" +
                "%s\n\n" +
                "Para completar tu registro, por favor verifica tu dirección de correo electrónico haciendo clic en el siguiente enlace:\n\n" +
                "%s\n\n" +
                "Este enlace expirará en 24 horas.\n\n" +
                "%s\n\n" +
                "Saludos,\n" +
                "El equipo de PSYmatch",
                name, 
                greeting,
                verificationUrl,
                isPsychologist 
                    ? "Una vez verificado tu correo, podrás comenzar a gestionar tu práctica profesional y recibir pacientes."
                    : "Si no creaste una cuenta en PSYmatch, puedes ignorar este correo."
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Error enviando correo de verificación: " + e.getMessage());
            throw new RuntimeException("Error al enviar el correo de verificación", e);
        }
    }

    public void sendAppointmentConfirmationEmail(String toEmail, String patientName, String psychologistName, 
                                                 java.time.Instant appointmentStart, java.time.Instant paymentDeadline, 
                                                 java.math.BigDecimal price) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Cita confirmada - PSYmatch");
            
            java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter
                .ofPattern("dd/MM/yyyy 'a las' HH:mm")
                .withZone(java.time.ZoneId.systemDefault());
            
            java.time.format.DateTimeFormatter deadlineFormatter = java.time.format.DateTimeFormatter
                .ofPattern("dd/MM/yyyy 'a las' HH:mm")
                .withZone(java.time.ZoneId.systemDefault());
            
            String appointmentDate = formatter.format(appointmentStart);
            String deadlineDate = deadlineFormatter.format(paymentDeadline);
            
            String emailBody = String.format(
                "Hola %s,\n\n" +
                "¡Tu solicitud de cita ha sido confirmada!\n\n" +
                "Detalles de la cita:\n" +
                "- Psicólogo: %s\n" +
                "- Fecha y hora: %s\n" +
                "- Precio: %.2f €\n\n" +
                "IMPORTANTE: Tienes hasta el %s para realizar el pago de tu cita.\n" +
                "Si no realizas el pago antes de esta fecha, la cita será cancelada automáticamente.\n\n" +
                "Puedes acceder a tu panel de usuario para realizar el pago y gestionar tus citas.\n\n" +
                "Saludos,\n" +
                "El equipo de PSYmatch",
                patientName,
                psychologistName,
                appointmentDate,
                price != null ? price.doubleValue() : 0.0,
                deadlineDate
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Error enviando correo de confirmación de cita: " + e.getMessage());
            // No lanzar excepción para no interrumpir el flujo si falla el envío de email
        }
    }
}

