package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.AppointmentEntity;
import com.alvaro.psicoapp.domain.AppointmentRequestEntity;
import com.alvaro.psicoapp.repository.AppointmentRepository;
import com.alvaro.psicoapp.repository.AppointmentRequestRepository;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.service.EmailService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.WeekFields;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/calendar")
public class CalendarController {
    private final AppointmentRepository appointmentRepository;
    private final AppointmentRequestRepository appointmentRequestRepository;
    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;
    private final EmailService emailService;

    public CalendarController(AppointmentRepository appointmentRepository, 
                             AppointmentRequestRepository appointmentRequestRepository,
                             UserRepository userRepository, 
                             UserPsychologistRepository userPsychologistRepository,
                             EmailService emailService) {
        this.appointmentRepository = appointmentRepository;
        this.appointmentRequestRepository = appointmentRequestRepository;
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.emailService = emailService;
    }

    // Psicólogo: crear slot libre
    @PostMapping("/slots")
    @Transactional
    public ResponseEntity<?> createSlot(Principal principal, @RequestBody Map<String, Object> body) {
        var me = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"PSYCHOLOGIST".equals(me.getRole())) return ResponseEntity.status(403).build();
        
        Instant start = Instant.parse(String.valueOf(body.get("start")));
        Instant end = Instant.parse(String.valueOf(body.get("end")));
        
        // Obtener el precio del body - OBLIGATORIO
        BigDecimal price = null;
        if (body.get("price") == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "El precio es obligatorio para crear una cita"));
        }
        
        try {
            if (body.get("price") instanceof Number) {
                price = BigDecimal.valueOf(((Number) body.get("price")).doubleValue());
            } else if (body.get("price") instanceof String) {
                String priceStr = ((String) body.get("price")).trim();
                if (priceStr.isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "El precio es obligatorio para crear una cita"));
                }
                price = new BigDecimal(priceStr);
            } else {
                price = new BigDecimal(String.valueOf(body.get("price")));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Precio inválido: " + e.getMessage()));
        }
        
        // Validar que el precio sea positivo
        if (price.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "El precio debe ser mayor a 0"));
        }
        
        // Validar regla de negocio: al menos una cita de la semana debe costar menos de 50€
        LocalDate appointmentDate = LocalDate.ofInstant(start, ZoneId.systemDefault());
        WeekFields weekFields = WeekFields.of(Locale.getDefault());
        int weekOfYear = appointmentDate.get(weekFields.weekOfWeekBasedYear());
        int year = appointmentDate.get(weekFields.weekBasedYear());
        
        // Calcular inicio y fin de la semana (lunes a domingo)
        LocalDate weekStart = appointmentDate.with(weekFields.dayOfWeek(), 1);
        LocalDate weekEnd = weekStart.plusDays(6);
        Instant weekStartInstant = weekStart.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant weekEndInstant = weekEnd.atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();
        
        // Obtener todas las citas de la semana del psicólogo
        List<AppointmentEntity> weekAppointments = appointmentRepository
            .findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(me.getId(), weekStartInstant, weekEndInstant);
        
        // Si el precio de esta cita es >= 50€, verificar que haya al menos una cita < 50€ en la semana
        if (price != null && price.compareTo(new BigDecimal("50.00")) >= 0) {
            boolean hasCheapAppointment = weekAppointments.stream()
                .anyMatch(apt -> apt.getPrice() != null && apt.getPrice().compareTo(new BigDecimal("50.00")) < 0);
            
            // Si no hay ninguna cita barata en la semana (excluyendo la que estamos creando), rechazar
            if (!hasCheapAppointment) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", 
                    "Al menos una cita de la semana debe costar menos de 50€. Actualmente no hay ninguna cita con precio menor a 50€ en esta semana."
                ));
            }
        }
        
        // Si todas las citas de la semana son >= 50€, esta nueva debe ser < 50€
        boolean allExpensive = weekAppointments.stream()
            .allMatch(apt -> apt.getPrice() != null && apt.getPrice().compareTo(new BigDecimal("50.00")) >= 0);
        
        if (allExpensive && price.compareTo(new BigDecimal("50.00")) >= 0) {
            return ResponseEntity.badRequest().body(Map.of(
                "error",
                "Al menos una cita de la semana debe costar menos de 50€. Por favor, establece un precio menor a 50€ para esta cita."
            ));
        }
        
        AppointmentEntity a = new AppointmentEntity();
        a.setPsychologist(me);
        a.setStartTime(start);
        a.setEndTime(end);
        a.setStatus("FREE");
        a.setPrice(price);
        
        return ResponseEntity.ok(appointmentRepository.save(a));
    }

    // Psicólogo: eliminar slot/cita
    @DeleteMapping("/slots/{appointmentId}")
    @Transactional
    public ResponseEntity<?> deleteSlot(Principal principal, @PathVariable Long appointmentId) {
        var psychologist = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"PSYCHOLOGIST".equals(psychologist.getRole())) {
            return ResponseEntity.status(403).build();
        }
        
        var appointment = appointmentRepository.findById(appointmentId).orElseThrow();
        
        // Verificar que la cita pertenece al psicólogo
        if (!appointment.getPsychologist().getId().equals(psychologist.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "No tienes permiso para eliminar esta cita"));
        }
        
        // Solo se pueden eliminar citas libres o con solicitudes pendientes
        // No se pueden eliminar citas confirmadas o reservadas directamente
        if ("CONFIRMED".equals(appointment.getStatus()) || "BOOKED".equals(appointment.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", 
                "No puedes eliminar citas confirmadas o reservadas. Usa la opción de cancelar en su lugar."
            ));
        }
        
        // Si tiene solicitudes pendientes, rechazarlas primero
        var pendingRequests = appointmentRequestRepository.findByAppointment_IdAndStatus(appointmentId, "PENDING");
        for (var req : pendingRequests) {
            req.setStatus("REJECTED");
            appointmentRequestRepository.save(req);
        }
        
        // Eliminar la cita
        appointmentRepository.delete(appointment);
        
        return ResponseEntity.ok(Map.of("message", "Cita eliminada exitosamente"));
    }

    // Psicólogo: listar slots del rango
    @GetMapping("/slots")
    public ResponseEntity<List<AppointmentEntity>> mySlots(Principal principal,
        @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        var me = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"PSYCHOLOGIST".equals(me.getRole())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(appointmentRepository.findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(me.getId(), from, to));
    }

    // Usuario: ver huecos libres de su psicólogo
    @GetMapping("/availability")
    public ResponseEntity<List<AppointmentEntity>> availability(Principal principal,
        @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        var rel = userPsychologistRepository.findByUserId(user.getId());
        if (rel.isEmpty()) return ResponseEntity.ok(List.of());
        var slots = appointmentRepository.findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(rel.get().getPsychologist().getId(), from, to);
        // Incluir slots libres, citas solicitadas por este usuario, citas confirmadas y citas reservadas por este usuario
        slots.removeIf(s -> {
            if ("FREE".equals(s.getStatus()) || "REQUESTED".equals(s.getStatus())) {
                return false; // Mostrar libres y solicitadas
            }
            if ("CONFIRMED".equals(s.getStatus()) || "BOOKED".equals(s.getStatus())) {
                return !(s.getUser() != null && s.getUser().getId().equals(user.getId()));
            }
            return true; // Ocultar canceladas y otros estados
        });
        return ResponseEntity.ok(slots);
    }

    // Usuario: obtener sus citas (reservadas, confirmadas y solicitudes)
    @GetMapping("/my-appointments")
    @Transactional(readOnly = true)
    public ResponseEntity<?> myAppointments(Principal principal) {
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        
        // Obtener citas confirmadas y reservadas
        var confirmedAppointments = appointmentRepository.findByUser_IdOrderByStartTimeAsc(user.getId())
            .stream()
            .filter(apt -> "CONFIRMED".equals(apt.getStatus()) || "BOOKED".equals(apt.getStatus()))
            .collect(Collectors.toList());
        
        // Obtener solicitudes pendientes del usuario
        var pendingRequests = appointmentRequestRepository.findByUser_IdOrderByRequestedAtDesc(user.getId())
            .stream()
            .filter(req -> "PENDING".equals(req.getStatus()))
            .collect(Collectors.toList());
        
        // Convertir citas confirmadas/reservadas a DTOs
        List<Map<String, Object>> result = confirmedAppointments.stream().map(apt -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", apt.getId());
            dto.put("startTime", apt.getStartTime() != null ? apt.getStartTime().toString() : null);
            dto.put("endTime", apt.getEndTime() != null ? apt.getEndTime().toString() : null);
            dto.put("status", apt.getStatus());
            dto.put("price", apt.getPrice());
            dto.put("paymentStatus", apt.getPaymentStatus());
            dto.put("paymentDeadline", apt.getPaymentDeadline() != null ? apt.getPaymentDeadline().toString() : null);
            dto.put("confirmedAt", apt.getConfirmedAt() != null ? apt.getConfirmedAt().toString() : null);
            if (apt.getPsychologist() != null) {
                Map<String, Object> psych = new HashMap<>();
                psych.put("id", apt.getPsychologist().getId());
                psych.put("name", apt.getPsychologist().getName());
                psych.put("email", apt.getPsychologist().getEmail());
                dto.put("psychologist", psych);
            }
            return dto;
        }).collect(Collectors.toList());
        
        // Agregar solicitudes pendientes como citas con estado REQUESTED
        for (var req : pendingRequests) {
            var apt = req.getAppointment();
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", apt.getId());
            dto.put("requestId", req.getId());
            dto.put("startTime", apt.getStartTime() != null ? apt.getStartTime().toString() : null);
            dto.put("endTime", apt.getEndTime() != null ? apt.getEndTime().toString() : null);
            dto.put("status", "REQUESTED");
            dto.put("price", apt.getPrice());
            dto.put("requestedAt", req.getRequestedAt().toString());
            if (apt.getPsychologist() != null) {
                Map<String, Object> psych = new HashMap<>();
                psych.put("id", apt.getPsychologist().getId());
                psych.put("name", apt.getPsychologist().getName());
                psych.put("email", apt.getPsychologist().getEmail());
                dto.put("psychologist", psych);
            }
            result.add(dto);
        }
        
        // Ordenar por fecha de inicio
        result.sort((a, b) -> {
            String startA = (String) a.get("startTime");
            String startB = (String) b.get("startTime");
            if (startA == null) return 1;
            if (startB == null) return -1;
            return startA.compareTo(startB);
        });
        
        return ResponseEntity.ok(result);
    }

    // Usuario: solicitar cita (crea una solicitud, no reserva directamente)
    @PostMapping("/book/{appointmentId}")
    @Transactional
    public ResponseEntity<?> book(Principal principal, @PathVariable Long appointmentId) {
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        var appt = appointmentRepository.findById(appointmentId).orElseThrow();
        
        // Verificar que la cita esté libre o ya tenga solicitudes
        if (!"FREE".equals(appt.getStatus()) && !"REQUESTED".equals(appt.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Esta cita ya no está disponible"));
        }
        
        // Verificar que el usuario no haya solicitado ya esta cita
        var existingRequest = appointmentRequestRepository.findByAppointment_IdAndUser_Id(appointmentId, user.getId());
        if (existingRequest.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ya has solicitado esta cita"));
        }
        
        // Crear la solicitud
        AppointmentRequestEntity request = new AppointmentRequestEntity();
        request.setAppointment(appt);
        request.setUser(user);
        request.setStatus("PENDING");
        appointmentRequestRepository.save(request);
        
        // Actualizar el estado de la cita a REQUESTED si estaba FREE
        if ("FREE".equals(appt.getStatus())) {
            appt.setStatus("REQUESTED");
            appointmentRepository.save(appt);
        }
        
        return ResponseEntity.ok(Map.of("message", "Solicitud de cita enviada. El psicólogo la revisará y confirmará."));
    }

    // Psicólogo: obtener solicitudes pendientes
    @GetMapping("/requests/pending")
    public ResponseEntity<?> getPendingRequests(Principal principal) {
        var psychologist = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"PSYCHOLOGIST".equals(psychologist.getRole())) {
            return ResponseEntity.status(403).build();
        }
        
        var requests = appointmentRequestRepository.findPendingByPsychologist_Id(psychologist.getId());
        
        List<Map<String, Object>> result = requests.stream().map(req -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", req.getId());
            dto.put("appointmentId", req.getAppointment().getId());
            dto.put("requestedAt", req.getRequestedAt().toString());
            dto.put("status", req.getStatus());
            
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", req.getUser().getId());
            userInfo.put("name", req.getUser().getName());
            userInfo.put("email", req.getUser().getEmail());
            dto.put("user", userInfo);
            
            Map<String, Object> appointmentInfo = new HashMap<>();
            appointmentInfo.put("id", req.getAppointment().getId());
            appointmentInfo.put("startTime", req.getAppointment().getStartTime().toString());
            appointmentInfo.put("endTime", req.getAppointment().getEndTime().toString());
            appointmentInfo.put("price", req.getAppointment().getPrice());
            dto.put("appointment", appointmentInfo);
            
            return dto;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(result);
    }

    // Psicólogo: confirmar una solicitud de cita
    @PostMapping("/confirm/{requestId}")
    @Transactional
    public ResponseEntity<?> confirmAppointment(Principal principal, @PathVariable Long requestId) {
        var psychologist = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"PSYCHOLOGIST".equals(psychologist.getRole())) {
            return ResponseEntity.status(403).build();
        }
        
        var request = appointmentRequestRepository.findById(requestId).orElseThrow();
        var appointment = request.getAppointment();
        
        // Verificar que la cita pertenece al psicólogo
        if (!appointment.getPsychologist().getId().equals(psychologist.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "No tienes permiso para confirmar esta cita"));
        }
        
        // Verificar que la solicitud esté pendiente
        if (!"PENDING".equals(request.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Esta solicitud ya fue procesada"));
        }
        
        // Rechazar todas las demás solicitudes para esta cita
        var allRequests = appointmentRequestRepository.findByAppointment_Id(appointment.getId());
        for (var req : allRequests) {
            if (req.getId().equals(requestId)) {
                req.setStatus("CONFIRMED");
            } else {
                req.setStatus("REJECTED");
            }
            appointmentRequestRepository.save(req);
        }
        
        // Confirmar la cita
        Instant now = Instant.now();
        appointment.setStatus("CONFIRMED");
        appointment.setUser(request.getUser());
        appointment.setConfirmedAt(now);
        appointment.setConfirmedByUser(request.getUser());
        appointment.setPaymentDeadline(now.plusSeconds(24 * 60 * 60)); // 24 horas
        appointment.setPaymentStatus("PENDING");
        appointmentRepository.save(appointment);
        
        // Enviar email de confirmación
        try {
            emailService.sendAppointmentConfirmationEmail(
                request.getUser().getEmail(),
                request.getUser().getName(),
                psychologist.getName(),
                appointment.getStartTime(),
                appointment.getPaymentDeadline(),
                appointment.getPrice()
            );
        } catch (Exception e) {
            System.err.println("Error enviando email de confirmación: " + e.getMessage());
        }
        
        return ResponseEntity.ok(Map.of("message", "Cita confirmada exitosamente"));
    }

    // Psicólogo: cancelar una cita
    @PostMapping("/cancel/{appointmentId}")
    @Transactional
    public ResponseEntity<?> cancelAppointment(Principal principal, @PathVariable Long appointmentId) {
        var psychologist = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"PSYCHOLOGIST".equals(psychologist.getRole())) {
            return ResponseEntity.status(403).build();
        }
        
        var appointment = appointmentRepository.findById(appointmentId).orElseThrow();
        
        // Verificar que la cita pertenece al psicólogo
        if (!appointment.getPsychologist().getId().equals(psychologist.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "No tienes permiso para cancelar esta cita"));
        }
        
        // Solo se pueden cancelar citas que no estén canceladas
        if ("CANCELLED".equals(appointment.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Esta cita ya está cancelada"));
        }
        
        // Rechazar todas las solicitudes pendientes
        var pendingRequests = appointmentRequestRepository.findByAppointment_IdAndStatus(appointmentId, "PENDING");
        for (var req : pendingRequests) {
            req.setStatus("REJECTED");
            appointmentRequestRepository.save(req);
        }
        
        // Cancelar la cita
        appointment.setStatus("CANCELLED");
        appointmentRepository.save(appointment);
        
        return ResponseEntity.ok(Map.of("message", "Cita cancelada exitosamente"));
    }

    // Psicólogo: crear cita directamente vinculada a un paciente
    @PostMapping("/create-for-patient")
    @Transactional
    public ResponseEntity<?> createForPatient(Principal principal, @RequestBody Map<String, Object> body) {
        var psychologist = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"PSYCHOLOGIST".equals(psychologist.getRole())) {
            return ResponseEntity.status(403).build();
        }
        
        Long userId = Long.valueOf(String.valueOf(body.get("userId")));
        Instant start = Instant.parse(String.valueOf(body.get("start")));
        Instant end = Instant.parse(String.valueOf(body.get("end")));
        
        // Verificar que el usuario es paciente del psicólogo
        var rel = userPsychologistRepository.findByUserId(userId);
        if (rel.isEmpty() || !rel.get().getPsychologist().getId().equals(psychologist.getId())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Este usuario no es tu paciente"));
        }
        
        BigDecimal price = null;
        if (body.get("price") != null) {
            try {
                if (body.get("price") instanceof Number) {
                    price = BigDecimal.valueOf(((Number) body.get("price")).doubleValue());
                } else if (body.get("price") instanceof String) {
                    String priceStr = ((String) body.get("price")).trim();
                    if (!priceStr.isEmpty()) {
                        price = new BigDecimal(priceStr);
                    }
                }
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Precio inválido: " + e.getMessage()));
            }
        }
        
        var user = userRepository.findById(userId).orElseThrow();
        Instant now = Instant.now();
        
        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setPsychologist(psychologist);
        appointment.setUser(user);
        appointment.setStartTime(start);
        appointment.setEndTime(end);
        appointment.setStatus("CONFIRMED");
        appointment.setPrice(price);
        appointment.setConfirmedAt(now);
        appointment.setConfirmedByUser(user);
        appointment.setPaymentDeadline(now.plusSeconds(24 * 60 * 60)); // 24 horas
        appointment.setPaymentStatus("PENDING");
        
        var saved = appointmentRepository.save(appointment);
        
        // Enviar email de confirmación
        try {
            emailService.sendAppointmentConfirmationEmail(
                user.getEmail(),
                user.getName(),
                psychologist.getName(),
                appointment.getStartTime(),
                appointment.getPaymentDeadline(),
                appointment.getPrice()
            );
        } catch (Exception e) {
            System.err.println("Error enviando email de confirmación: " + e.getMessage());
        }
        
        return ResponseEntity.ok(saved);
    }
}


