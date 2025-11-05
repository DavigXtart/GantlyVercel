package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.AppointmentEntity;
import com.alvaro.psicoapp.repository.AppointmentRepository;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calendar")
public class CalendarController {
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;

    public CalendarController(AppointmentRepository appointmentRepository, UserRepository userRepository, UserPsychologistRepository userPsychologistRepository) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
    }

    // Psicólogo: crear slot libre
    @PostMapping("/slots")
    @Transactional
    public ResponseEntity<AppointmentEntity> createSlot(Principal principal, @RequestBody Map<String, Object> body) {
        var me = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"PSYCHOLOGIST".equals(me.getRole())) return ResponseEntity.status(403).build();
        Instant start = Instant.parse(String.valueOf(body.get("start")));
        Instant end = Instant.parse(String.valueOf(body.get("end")));
        AppointmentEntity a = new AppointmentEntity();
        a.setPsychologist(me);
        a.setStartTime(start);
        a.setEndTime(end);
        a.setStatus("FREE");
        return ResponseEntity.ok(appointmentRepository.save(a));
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
        // Incluir slots libres Y citas reservadas por este usuario
        slots.removeIf(s -> !"FREE".equals(s.getStatus()) && !(s.getStatus().equals("BOOKED") && s.getUser() != null && s.getUser().getId().equals(user.getId())));
        return ResponseEntity.ok(slots);
    }

    // Usuario: obtener sus citas reservadas
    @GetMapping("/my-appointments")
    @Transactional(readOnly = true)
    public ResponseEntity<?> myAppointments(Principal principal) {
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        var appointments = appointmentRepository.findBookedByUser_IdOrderByStartTimeAsc(user.getId());
        
        // Convertir a DTOs para evitar problemas de serialización
        List<Map<String, Object>> result = appointments.stream().map(apt -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", apt.getId());
            dto.put("startTime", apt.getStartTime() != null ? apt.getStartTime().toString() : null);
            dto.put("endTime", apt.getEndTime() != null ? apt.getEndTime().toString() : null);
            dto.put("status", apt.getStatus());
            if (apt.getPsychologist() != null) {
                Map<String, Object> psych = new HashMap<>();
                psych.put("id", apt.getPsychologist().getId());
                psych.put("name", apt.getPsychologist().getName());
                psych.put("email", apt.getPsychologist().getEmail());
                dto.put("psychologist", psych);
            }
            return dto;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(result);
    }

    // Usuario: reservar hueco libre
    @PostMapping("/book/{appointmentId}")
    @Transactional
    public ResponseEntity<?> book(Principal principal, @PathVariable Long appointmentId) {
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        var appt = appointmentRepository.findById(appointmentId).orElseThrow();
        
        System.out.println("=== Reservando cita ===");
        System.out.println("Usuario: " + user.getEmail() + " (ID: " + user.getId() + ")");
        System.out.println("Appointment ID: " + appointmentId);
        System.out.println("Estado actual: " + appt.getStatus());
        
        if (!"FREE".equals(appt.getStatus())) {
            System.err.println("❌ La cita no está libre, estado: " + appt.getStatus());
            return ResponseEntity.badRequest().body(Map.of("error", "Esta cita ya no está disponible"));
        }
        
        // Validar que el usuario no tenga ya una cita ese día
        LocalDate appointmentDate = LocalDate.ofInstant(appt.getStartTime(), ZoneId.systemDefault());
        Instant startOfDay = appointmentDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endOfDay = appointmentDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        
        // Obtener todas las citas del usuario en ese día
        var userAppointments = appointmentRepository.findBookedByUser_IdOrderByStartTimeAsc(user.getId());
        boolean hasAppointmentToday = userAppointments.stream()
            .anyMatch(a -> {
                LocalDate aptDate = LocalDate.ofInstant(a.getStartTime(), ZoneId.systemDefault());
                return aptDate.equals(appointmentDate) && "BOOKED".equals(a.getStatus());
            });
        
        if (hasAppointmentToday) {
            System.err.println("❌ El usuario ya tiene una cita ese día");
            return ResponseEntity.badRequest().body(Map.of("error", "Ya tienes una cita reservada para este día"));
        }
        
        System.out.println("💾 Asignando usuario a la cita...");
        appt.setUser(user);
        appt.setStatus("BOOKED");
        
        System.out.println("💾 Guardando cita...");
        var saved = appointmentRepository.save(appt);
        appointmentRepository.flush(); // Forzar flush inmediato
        
        System.out.println("✅ Cita guardada con ID: " + saved.getId());
        System.out.println("✅ Estado: " + saved.getStatus());
        System.out.println("✅ Usuario asignado: " + (saved.getUser() != null ? saved.getUser().getEmail() : "null"));
        
        // Verificar que realmente se guardó
        var verify = appointmentRepository.findById(saved.getId());
        if (verify.isEmpty()) {
            System.err.println("❌ ERROR: La cita no se guardó en la BD después del save!");
            return ResponseEntity.status(500).body(Map.of("error", "Error al guardar la cita"));
        }
        
        var verified = verify.get();
        System.out.println("✅ Verificación: Cita encontrada en BD");
        System.out.println("✅ Estado verificado: " + verified.getStatus());
        System.out.println("✅ Usuario verificado: " + (verified.getUser() != null ? verified.getUser().getEmail() : "null"));
        
        return ResponseEntity.ok(Map.of("message", "Cita reservada exitosamente"));
    }
}


