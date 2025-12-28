package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.AppointmentEntity;
import com.alvaro.psicoapp.repository.AppointmentRepository;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/jitsi")
public class JitsiController {
    private static final Logger logger = LoggerFactory.getLogger(JitsiController.class);
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;

    public JitsiController(AppointmentRepository appointmentRepository, 
                          UserRepository userRepository,
                          UserPsychologistRepository userPsychologistRepository) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
    }

    /**
     * Obtiene información de la sala de videollamada validando que existe una cita activa
     */
    @GetMapping("/room-info")
    @Transactional(readOnly = true)
    @CrossOrigin(origins = "*")
    public ResponseEntity<?> getRoomInfo(Principal principal, @RequestParam String otherUserEmail) {
        try {
            var currentUser = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("Usuario actual no encontrado"));
            var otherUser = userRepository.findByEmail(otherUserEmail).orElseThrow(() -> new RuntimeException("Usuario destino no encontrado"));
            
            // Validar que existe una relación psicólogo-paciente o una cita activa
            boolean hasValidRelation = false;
            String roomName = null;
        
        if ("PSYCHOLOGIST".equals(currentUser.getRole()) && "USER".equals(otherUser.getRole())) {
            // Verificar relación psicólogo-paciente
            var relation = userPsychologistRepository.findByUserId(otherUser.getId());
            if (relation.isPresent() && relation.get().getPsychologist().getId().equals(currentUser.getId())) {
                hasValidRelation = true;
            }
        } else if ("USER".equals(currentUser.getRole()) && "PSYCHOLOGIST".equals(otherUser.getRole())) {
            // Verificar relación paciente-psicólogo
            var relation = userPsychologistRepository.findByUserId(currentUser.getId());
            if (relation.isPresent() && relation.get().getPsychologist().getId().equals(otherUser.getId())) {
                hasValidRelation = true;
            }
        }
        
        // Verificar si hay una cita activa (hoy o en el futuro)
        if (hasValidRelation) {
            Instant now = Instant.now();
            // Máximo 1 hora antes de la cita
            Instant oneHourBefore = now.minusSeconds(3600);
            List<AppointmentEntity> activeAppointments;
            
            if ("PSYCHOLOGIST".equals(currentUser.getRole())) {
                activeAppointments = appointmentRepository
                    .findByPsychologist_IdAndUser_IdAndStartTimeGreaterThanEqualAndStatus(
                        currentUser.getId(), 
                        otherUser.getId(), 
                        oneHourBefore, 
                        "BOOKED"
                    );
            } else {
                activeAppointments = appointmentRepository
                    .findByPsychologist_IdAndUser_IdAndStartTimeGreaterThanEqualAndStatus(
                        otherUser.getId(), 
                        currentUser.getId(), 
                        oneHourBefore, 
                        "BOOKED"
                    );
            }
            
            // Filtrar para encontrar citas que estén dentro del rango permitido
            // (máximo 1 hora antes, durante la cita, o hasta 1 hora después)
            AppointmentEntity validAppointment = activeAppointments.stream()
                .filter(apt -> {
                    Instant startTime = apt.getStartTime();
                    Instant endTime = apt.getEndTime();
                    // Permitir iniciar si:
                    // 1. La cita ya comenzó (ahora >= startTime) Y aún no ha terminado (ahora <= endTime + 1 hora)
                    // 2. O la cita comienza en máximo 1 hora (startTime - 1 hora <= ahora <= startTime)
                    Instant oneHourBeforeStart = startTime.minusSeconds(3600);
                    Instant oneHourAfterEnd = endTime.plusSeconds(3600);
                    
                    return (now.isAfter(oneHourBeforeStart) || now.equals(oneHourBeforeStart)) 
                        && (now.isBefore(oneHourAfterEnd) || now.equals(oneHourAfterEnd));
                })
                .findFirst()
                .orElse(null);
            
            if (validAppointment != null) {
                // Generar nombre de sala determinístico
                String email1 = currentUser.getEmail().toLowerCase().trim();
                String email2 = otherUser.getEmail().toLowerCase().trim();
                String[] emails = {email1, email2};
                java.util.Arrays.sort(emails);
                roomName = "psymatch-" + emails[0].replace("@", "-at-").replace(".", "-") + 
                          "-" + emails[1].replace("@", "-at-").replace(".", "-");
                roomName = roomName.replaceAll("--+", "-").replaceAll("^-|-$", "");
                if (roomName.length() > 50) {
                    roomName = roomName.substring(0, 50);
                }
                
                Map<String, Object> response = new HashMap<>();
                response.put("roomName", roomName);
                response.put("currentUser", Map.of(
                    "email", currentUser.getEmail(),
                    "name", currentUser.getName()
                ));
                response.put("otherUser", Map.of(
                    "email", otherUser.getEmail(),
                    "name", otherUser.getName()
                ));
                response.put("hasActiveAppointment", true);
                
                // Registrar inicio de videollamada (opcional, para logging)
                logger.info("Videollamada iniciada: {} <-> {} (Sala: {}), Cita: {} - {}", 
                    currentUser.getEmail(), otherUser.getEmail(), roomName, 
                    validAppointment.getStartTime(), validAppointment.getEndTime());
                
                return ResponseEntity.ok(response);
            } else {
                // Hay relación pero no hay cita en el rango permitido
                if (!activeAppointments.isEmpty()) {
                    AppointmentEntity nextAppointment = activeAppointments.stream()
                        .filter(apt -> apt.getStartTime().isAfter(now))
                        .min((a1, a2) -> a1.getStartTime().compareTo(a2.getStartTime()))
                        .orElse(null);
                    
                    if (nextAppointment != null) {
                        Instant startTime = nextAppointment.getStartTime();
                        Instant oneHourBeforeAppointment = startTime.minusSeconds(3600);
                        if (now.isBefore(oneHourBeforeAppointment)) {
                            long minutesUntil = (oneHourBeforeAppointment.toEpochMilli() - now.toEpochMilli()) / (1000 * 60);
                            return ResponseEntity.status(403).body(Map.of(
                                "error", "Solo puedes iniciar la videollamada máximo 1 hora antes de la cita. Podrás iniciarla en " + minutesUntil + " minutos."
                            ));
                        }
                    }
                }
            }
        }
        
        return ResponseEntity.status(403).body(Map.of(
            "error", "No tienes una cita activa con este usuario o no existe relación válida. Solo puedes iniciar videollamadas máximo 1 hora antes de la hora de la cita."
        ));
        } catch (Exception e) {
            logger.error("Error al procesar la solicitud de información de sala", e);
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error al procesar la solicitud: " + e.getMessage()
            ));
        }
    }
}

