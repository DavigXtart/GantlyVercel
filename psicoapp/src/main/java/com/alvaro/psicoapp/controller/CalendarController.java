package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.AppointmentEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.CalendarDtos;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.service.CalendarService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Calendario", description = "APIs para gestión de citas, disponibilidad y calificaciones de psicólogos")
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
    @Operation(summary = "Crear slot de disponibilidad", description = "Crea un nuevo slot de disponibilidad para citas (solo psicólogos)")
    @ApiResponse(responseCode = "200", description = "Slot creado exitosamente")
    public ResponseEntity<?> createSlot(Principal principal, @Valid @RequestBody CalendarDtos.CreateSlotRequest req) {
        AppointmentEntity slot = calendarService.createSlot(currentUser(principal), req);
        return ResponseEntity.ok(slot);
    }

    @DeleteMapping("/slots/{appointmentId}")
    @Transactional
    @Operation(summary = "Eliminar slot", description = "Elimina un slot de disponibilidad")
    @ApiResponse(responseCode = "200", description = "Slot eliminado exitosamente")
    public ResponseEntity<CalendarDtos.MessageResponse> deleteSlot(Principal principal, @PathVariable Long appointmentId) {
        calendarService.deleteSlot(currentUser(principal), appointmentId);
        return ResponseEntity.ok(new CalendarDtos.MessageResponse("Cita eliminada exitosamente"));
    }

    @PutMapping("/slots/{appointmentId}")
    @Transactional
    @Operation(summary = "Actualizar slot", description = "Actualiza los datos de un slot de disponibilidad")
    @ApiResponse(responseCode = "200", description = "Slot actualizado exitosamente")
    public ResponseEntity<CalendarDtos.UpdateSlotResponse> updateSlot(Principal principal, @PathVariable Long appointmentId,
                                        @RequestBody CalendarDtos.UpdateSlotRequest req) {
        AppointmentEntity appointment = calendarService.updateSlot(currentUser(principal), appointmentId, req);
        return ResponseEntity.ok(new CalendarDtos.UpdateSlotResponse("Cita actualizada exitosamente", appointment));
    }

    @GetMapping("/slots")
    @Operation(summary = "Obtener mis slots", description = "Obtiene los slots de disponibilidad del psicólogo en un rango de fechas")
    @ApiResponse(responseCode = "200", description = "Slots obtenidos exitosamente")
    public ResponseEntity<List<AppointmentEntity>> mySlots(Principal principal,
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return ResponseEntity.ok(calendarService.getMySlots(currentUser(principal), from, to));
    }

    @GetMapping("/availability")
    @Operation(summary = "Obtener disponibilidad", description = "Obtiene la disponibilidad de citas del psicólogo del usuario")
    @ApiResponse(responseCode = "200", description = "Disponibilidad obtenida exitosamente")
    public ResponseEntity<List<AppointmentEntity>> availability(Principal principal,
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return ResponseEntity.ok(calendarService.getAvailability(currentUser(principal), from, to));
    }

    @GetMapping("/my-appointments")
    @Transactional(readOnly = true)
    @Operation(summary = "Obtener mis citas", description = "Obtiene todas las citas del usuario autenticado")
    @ApiResponse(responseCode = "200", description = "Citas obtenidas exitosamente")
    public ResponseEntity<List<CalendarDtos.AppointmentListItemDto>> myAppointments(Principal principal) {
        return ResponseEntity.ok(calendarService.getMyAppointments(currentUser(principal)));
    }

    @PostMapping("/book/{appointmentId}")
    @Transactional
    @Operation(summary = "Reservar cita", description = "Solicita una cita en un slot disponible")
    @ApiResponse(responseCode = "200", description = "Solicitud de cita enviada exitosamente")
    public ResponseEntity<CalendarDtos.MessageResponse> book(Principal principal, @PathVariable Long appointmentId) {
        calendarService.bookAppointment(currentUser(principal), appointmentId);
        return ResponseEntity.ok(new CalendarDtos.MessageResponse("Solicitud de cita enviada. El psicólogo la revisará y confirmará."));
    }

    @GetMapping("/requests/pending")
    @Operation(summary = "Obtener solicitudes pendientes", description = "Obtiene las solicitudes de cita pendientes de confirmación (solo psicólogos)")
    @ApiResponse(responseCode = "200", description = "Solicitudes obtenidas exitosamente")
    public ResponseEntity<List<CalendarDtos.PendingRequestDto>> getPendingRequests(Principal principal) {
        return ResponseEntity.ok(calendarService.getPendingRequests(currentUser(principal)));
    }

    @PostMapping("/confirm/{requestId}")
    @Transactional
    @Operation(summary = "Confirmar cita", description = "Confirma una solicitud de cita pendiente (solo psicólogos)")
    @ApiResponse(responseCode = "200", description = "Cita confirmada exitosamente")
    public ResponseEntity<CalendarDtos.MessageResponse> confirmAppointment(Principal principal, @PathVariable Long requestId) {
        calendarService.confirmAppointment(currentUser(principal), requestId);
        return ResponseEntity.ok(new CalendarDtos.MessageResponse("Cita confirmada exitosamente"));
    }

    @PostMapping("/cancel/{appointmentId}")
    @Transactional
    @Operation(summary = "Cancelar cita", description = "Cancela una cita existente")
    @ApiResponse(responseCode = "200", description = "Cita cancelada exitosamente")
    public ResponseEntity<CalendarDtos.MessageResponse> cancelAppointment(Principal principal, @PathVariable Long appointmentId) {
        calendarService.cancelAppointment(currentUser(principal), appointmentId);
        return ResponseEntity.ok(new CalendarDtos.MessageResponse("Cita cancelada exitosamente"));
    }

    @PostMapping("/create-for-patient")
    @Transactional
    @Operation(summary = "Crear cita para paciente", description = "Crea una cita directamente para un paciente (solo psicólogos)")
    @ApiResponse(responseCode = "200", description = "Cita creada exitosamente")
    public ResponseEntity<CalendarDtos.CreateForPatientResponse> createForPatient(Principal principal,
                                                                @Valid @RequestBody CalendarDtos.CreateForPatientRequest req) {
        return ResponseEntity.ok(calendarService.createForPatient(currentUser(principal), req));
    }

    @GetMapping("/past-appointments")
    @Transactional(readOnly = true)
    @Operation(summary = "Obtener citas pasadas", description = "Obtiene el historial de citas pasadas del usuario")
    @ApiResponse(responseCode = "200", description = "Citas pasadas obtenidas exitosamente")
    public ResponseEntity<List<CalendarDtos.PastAppointmentDto>> getPastAppointments(Principal principal) {
        return ResponseEntity.ok(calendarService.getPastAppointments(currentUser(principal)));
    }

    @PostMapping("/appointments/{appointmentId}/rate")
    @Transactional
    @Operation(summary = "Calificar cita", description = "Califica una cita completada")
    @ApiResponse(responseCode = "200", description = "Cita calificada exitosamente")
    public ResponseEntity<CalendarDtos.RateAppointmentResponse> rateAppointment(Principal principal,
            @PathVariable Long appointmentId, @Valid @RequestBody CalendarDtos.RateAppointmentRequest req) {
        return ResponseEntity.ok(calendarService.rateAppointment(currentUser(principal), appointmentId, req));
    }

    @GetMapping("/psychologist/{psychologistId}/rating")
    @Transactional(readOnly = true)
    @Operation(summary = "Obtener calificación de psicólogo", description = "Obtiene la calificación promedio de un psicólogo")
    @ApiResponse(responseCode = "200", description = "Calificación obtenida exitosamente")
    public ResponseEntity<CalendarDtos.PsychologistRatingResponse> getPsychologistRating(@PathVariable Long psychologistId) {
        return ResponseEntity.ok(calendarService.getPsychologistRating(psychologistId));
    }

    @GetMapping("/psychologist/{psychologistId}/ratings")
    @Transactional(readOnly = true)
    @Operation(summary = "Obtener todas las calificaciones de psicólogo", description = "Obtiene todas las calificaciones individuales de un psicólogo")
    @ApiResponse(responseCode = "200", description = "Calificaciones obtenidas exitosamente")
    public ResponseEntity<List<CalendarDtos.PsychologistRatingDetailDto>> getPsychologistRatings(@PathVariable Long psychologistId) {
        return ResponseEntity.ok(calendarService.getPsychologistRatings(psychologistId));
    }

    @GetMapping("/psychologist/past-appointments")
    @Transactional(readOnly = true)
    @Operation(summary = "Obtener citas pasadas del psicólogo", description = "Obtiene el historial de citas pasadas del psicólogo autenticado")
    @ApiResponse(responseCode = "200", description = "Citas pasadas obtenidas exitosamente")
    public ResponseEntity<List<CalendarDtos.PsychologistPastAppointmentDto>> getPsychologistPastAppointments(Principal principal) {
        return ResponseEntity.ok(calendarService.getPsychologistPastAppointments(currentUser(principal)));
    }

    @GetMapping("/psychologist/billing-appointments")
    @Transactional(readOnly = true)
    public ResponseEntity<List<CalendarDtos.PsychologistPastAppointmentDto>> getBillingAppointments(Principal principal) {
        return ResponseEntity.ok(calendarService.getBillingAppointments(currentUser(principal)));
    }

    @PutMapping("/appointments/{appointmentId}/notes")
    @Transactional
    @Operation(summary = "Actualizar notas de cita", description = "Permite al psicólogo añadir notas a una cita pasada")
    @ApiResponse(responseCode = "200", description = "Notas actualizadas exitosamente")
    public ResponseEntity<CalendarDtos.MessageResponse> updateAppointmentNotes(Principal principal,
            @PathVariable Long appointmentId, @RequestBody Map<String, String> body) {
        String notes = body.get("notes");
        calendarService.updateAppointmentNotes(appointmentId, notes, currentUser(principal));
        return ResponseEntity.ok(new CalendarDtos.MessageResponse("Notas actualizadas exitosamente"));
    }

    @GetMapping("/appointments/{appointmentId}/notes")
    @Transactional(readOnly = true)
    @Operation(summary = "Obtener notas de cita", description = "Obtiene las notas de una cita (solo psicólogo asignado)")
    @ApiResponse(responseCode = "200", description = "Notas obtenidas exitosamente")
    public ResponseEntity<Map<String, String>> getAppointmentNotes(Principal principal,
            @PathVariable Long appointmentId) {
        String notes = calendarService.getAppointmentNotes(appointmentId, currentUser(principal));
        return ResponseEntity.ok(Map.of("notes", notes != null ? notes : ""));
    }
}
