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
import java.util.List;
import java.util.Map;

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
        slots.removeIf(s -> !"FREE".equals(s.getStatus()));
        return ResponseEntity.ok(slots);
    }

    // Usuario: reservar hueco libre
    @PostMapping("/book/{appointmentId}")
    @Transactional
    public ResponseEntity<Void> book(Principal principal, @PathVariable Long appointmentId) {
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        var appt = appointmentRepository.findById(appointmentId).orElseThrow();
        if (!"FREE".equals(appt.getStatus())) return ResponseEntity.badRequest().build();
        appt.setUser(user);
        appt.setStatus("BOOKED");
        appointmentRepository.save(appt);
        return ResponseEntity.ok().build();
    }
}


