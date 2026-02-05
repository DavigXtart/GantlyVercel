package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.AppointmentEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.CalendarDtos;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.service.CalendarService;
import jakarta.validation.Valid;
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
    private final CalendarService calendarService;
    private final UserRepository userRepository;

    public CalendarController(CalendarService calendarService, UserRepository userRepository) {
        this.calendarService = calendarService;
        this.userRepository = userRepository;
    }

    private UserEntity currentUser(Principal principal) {
        return userRepository.findByEmail(principal.getName()).orElseThrow();
    }

    @PostMapping("/slots")
    @Transactional
    public ResponseEntity<?> createSlot(Principal principal, @Valid @RequestBody CalendarDtos.CreateSlotRequest req) {
        AppointmentEntity slot = calendarService.createSlot(currentUser(principal), req);
        return ResponseEntity.ok(slot);
    }

    @DeleteMapping("/slots/{appointmentId}")
    @Transactional
    public ResponseEntity<CalendarDtos.MessageResponse> deleteSlot(Principal principal, @PathVariable Long appointmentId) {
        calendarService.deleteSlot(currentUser(principal), appointmentId);
        return ResponseEntity.ok(new CalendarDtos.MessageResponse("Cita eliminada exitosamente"));
    }

    @PutMapping("/slots/{appointmentId}")
    @Transactional
    public ResponseEntity<CalendarDtos.UpdateSlotResponse> updateSlot(Principal principal, @PathVariable Long appointmentId,
                                        @RequestBody CalendarDtos.UpdateSlotRequest req) {
        AppointmentEntity appointment = calendarService.updateSlot(currentUser(principal), appointmentId, req);
        return ResponseEntity.ok(new CalendarDtos.UpdateSlotResponse("Cita actualizada exitosamente", appointment));
    }

    @GetMapping("/slots")
    public ResponseEntity<List<AppointmentEntity>> mySlots(Principal principal,
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return ResponseEntity.ok(calendarService.getMySlots(currentUser(principal), from, to));
    }

    @GetMapping("/availability")
    public ResponseEntity<List<AppointmentEntity>> availability(Principal principal,
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return ResponseEntity.ok(calendarService.getAvailability(currentUser(principal), from, to));
    }

    @GetMapping("/my-appointments")
    @Transactional(readOnly = true)
    public ResponseEntity<List<CalendarDtos.AppointmentListItemDto>> myAppointments(Principal principal) {
        return ResponseEntity.ok(calendarService.getMyAppointments(currentUser(principal)));
    }

    @PostMapping("/book/{appointmentId}")
    @Transactional
    public ResponseEntity<CalendarDtos.MessageResponse> book(Principal principal, @PathVariable Long appointmentId) {
        calendarService.bookAppointment(currentUser(principal), appointmentId);
        return ResponseEntity.ok(new CalendarDtos.MessageResponse("Solicitud de cita enviada. El psicólogo la revisará y confirmará."));
    }

    @GetMapping("/requests/pending")
    public ResponseEntity<List<CalendarDtos.PendingRequestDto>> getPendingRequests(Principal principal) {
        return ResponseEntity.ok(calendarService.getPendingRequests(currentUser(principal)));
    }

    @PostMapping("/confirm/{requestId}")
    @Transactional
    public ResponseEntity<CalendarDtos.MessageResponse> confirmAppointment(Principal principal, @PathVariable Long requestId) {
        calendarService.confirmAppointment(currentUser(principal), requestId);
        return ResponseEntity.ok(new CalendarDtos.MessageResponse("Cita confirmada exitosamente"));
    }

    @PostMapping("/cancel/{appointmentId}")
    @Transactional
    public ResponseEntity<CalendarDtos.MessageResponse> cancelAppointment(Principal principal, @PathVariable Long appointmentId) {
        calendarService.cancelAppointment(currentUser(principal), appointmentId);
        return ResponseEntity.ok(new CalendarDtos.MessageResponse("Cita cancelada exitosamente"));
    }

    @PostMapping("/create-for-patient")
    @Transactional
    public ResponseEntity<CalendarDtos.CreateForPatientResponse> createForPatient(Principal principal,
                                                                @Valid @RequestBody CalendarDtos.CreateForPatientRequest req) {
        return ResponseEntity.ok(calendarService.createForPatient(currentUser(principal), req));
    }

    @GetMapping("/past-appointments")
    @Transactional(readOnly = true)
    public ResponseEntity<List<CalendarDtos.PastAppointmentDto>> getPastAppointments(Principal principal) {
        return ResponseEntity.ok(calendarService.getPastAppointments(currentUser(principal)));
    }

    @PostMapping("/appointments/{appointmentId}/rate")
    @Transactional
    public ResponseEntity<CalendarDtos.RateAppointmentResponse> rateAppointment(Principal principal,
            @PathVariable Long appointmentId, @Valid @RequestBody CalendarDtos.RateAppointmentRequest req) {
        return ResponseEntity.ok(calendarService.rateAppointment(currentUser(principal), appointmentId, req));
    }

    @GetMapping("/psychologist/{psychologistId}/rating")
    @Transactional(readOnly = true)
    public ResponseEntity<CalendarDtos.PsychologistRatingResponse> getPsychologistRating(@PathVariable Long psychologistId) {
        return ResponseEntity.ok(calendarService.getPsychologistRating(psychologistId));
    }

    @GetMapping("/psychologist/past-appointments")
    @Transactional(readOnly = true)
    public ResponseEntity<List<CalendarDtos.PsychologistPastAppointmentDto>> getPsychologistPastAppointments(Principal principal) {
        return ResponseEntity.ok(calendarService.getPsychologistPastAppointments(currentUser(principal)));
    }
}
