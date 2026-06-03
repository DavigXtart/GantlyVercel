package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.AppointmentEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.CalendarDtos;
import com.alvaro.psicoapp.dto.WeeklyScheduleDtos;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.service.CalendarService;
import com.alvaro.psicoapp.service.WeeklyScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.security.Principal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calendar")
@Tag(name = "Calendario", description = "APIs para gestión de citas, disponibilidad y calificaciones de psicólogos")
public class CalendarController {
    private final CalendarService calendarService;
    private final WeeklyScheduleService weeklyScheduleService;
    private final UserRepository userRepository;

    public CalendarController(CalendarService calendarService, WeeklyScheduleService weeklyScheduleService,
                              UserRepository userRepository) {
        this.calendarService = calendarService;
        this.weeklyScheduleService = weeklyScheduleService;
        this.userRepository = userRepository;
    }

    private UserEntity currentUser(Principal principal) {
        return userRepository.findByEmail(principal.getName()).orElseThrow();
    }

    @PostMapping("/slots")
    @Transactional
    @Operation(summary = "Crear slot de disponibilidad", description = "Crea un nuevo slot de disponibilidad para citas (solo psicólogos). Soporta recurrencia semanal/quincenal/mensual.")
    @ApiResponse(responseCode = "200", description = "Slot creado exitosamente")
    public ResponseEntity<?> createSlot(Principal principal, @Valid @RequestBody CalendarDtos.CreateSlotRequest req) {
        List<AppointmentEntity> slots = calendarService.createSlot(currentUser(principal), req);
        if (slots.size() == 1) return ResponseEntity.ok(slots.get(0));
        return ResponseEntity.ok(slots);
    }

    @DeleteMapping("/recurrence/{groupId}")
    @Transactional
    @Operation(summary = "Eliminar serie recurrente", description = "Elimina todos los slots libres de una serie recurrente")
    @ApiResponse(responseCode = "200", description = "Serie eliminada exitosamente")
    public ResponseEntity<CalendarDtos.DeleteRecurrenceResponse> deleteRecurrenceGroup(
            Principal principal, @PathVariable String groupId) {
        return ResponseEntity.ok(calendarService.deleteRecurrenceGroup(currentUser(principal), groupId));
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

    @PostMapping("/internal-slot")
    @Operation(summary = "Crear cita interna", description = "Crea una cita interna/bloqueada sin que el paciente reserve (solo psicólogos)")
    @ApiResponse(responseCode = "200", description = "Cita interna creada")
    public ResponseEntity<CalendarDtos.InternalSlotResponse> createInternalSlot(Principal principal,
                                                            @Valid @RequestBody CalendarDtos.CreateInternalSlotRequest req) {
        return ResponseEntity.ok(calendarService.createInternalSlot(currentUser(principal), req));
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
    @Operation(summary = "Obtener citas de facturación", description = "Obtiene las citas de facturación del psicólogo con paginación opcional. " +
            "Si no se envían parámetros page/size, devuelve todos los resultados (backwards compatible).")
    @ApiResponse(responseCode = "200", description = "Citas de facturación obtenidas exitosamente")
    public ResponseEntity<?> getBillingAppointments(Principal principal,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false, defaultValue = "startTime") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir) {
        UserEntity psychologist = currentUser(principal);
        if (page == null && size == null) {
            // Backwards compatible: return plain list when no pagination params
            return ResponseEntity.ok(calendarService.getBillingAppointments(psychologist));
        }
        int pageNum = page != null ? page : 0;
        int pageSize = size != null ? size : 10000;
        Sort sort = "desc".equalsIgnoreCase(sortDir)
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(pageNum, pageSize, sort);
        Page<CalendarDtos.PsychologistPastAppointmentDto> result =
                calendarService.getBillingAppointmentsPaged(psychologist, pageable);
        Map<String, Object> response = new HashMap<>();
        response.put("content", result.getContent());
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());
        response.put("currentPage", result.getNumber());
        response.put("pageSize", result.getSize());
        response.put("first", result.isFirst());
        response.put("last", result.isLast());
        return ResponseEntity.ok(response);
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

    @PutMapping("/appointments/{appointmentId}/reschedule")
    @Transactional
    @Operation(summary = "Reagendar cita", description = "Reagenda una cita existente a un nuevo horario. Solo permitido para citas BOOKED/CONFIRMED.")
    @ApiResponse(responseCode = "200", description = "Cita reagendada exitosamente")
    public ResponseEntity<CalendarDtos.MessageResponse> rescheduleAppointment(Principal principal,
            @PathVariable Long appointmentId, @Valid @RequestBody CalendarDtos.RescheduleAppointmentRequest req) {
        return ResponseEntity.ok(calendarService.rescheduleAppointment(currentUser(principal), appointmentId, req));
    }

    // --- Absence management ---

    @PostMapping("/absences")
    @Transactional
    @Operation(summary = "Crear ausencia", description = "Registra un periodo de ausencia para el psicólogo. Elimina slots libres que se solapen.")
    @ApiResponse(responseCode = "200", description = "Ausencia creada exitosamente")
    public ResponseEntity<?> createAbsence(Principal principal, @RequestBody Map<String, String> body) {
        Instant start = Instant.parse(body.get("startTime"));
        Instant end = Instant.parse(body.get("endTime"));
        String reason = body.get("reason");
        var absence = calendarService.createAbsence(currentUser(principal), start, end, reason);
        return ResponseEntity.ok(absence);
    }

    @GetMapping("/absences")
    @Operation(summary = "Obtener ausencias", description = "Obtiene las ausencias futuras del psicólogo")
    @ApiResponse(responseCode = "200", description = "Ausencias obtenidas exitosamente")
    public ResponseEntity<?> getAbsences(Principal principal) {
        return ResponseEntity.ok(calendarService.getAbsences(currentUser(principal)));
    }

    @DeleteMapping("/absences/{id}")
    @Transactional
    @Operation(summary = "Eliminar ausencia", description = "Elimina un periodo de ausencia registrado")
    @ApiResponse(responseCode = "200", description = "Ausencia eliminada exitosamente")
    public ResponseEntity<?> deleteAbsence(Principal principal, @PathVariable Long id) {
        calendarService.deleteAbsence(currentUser(principal), id);
        return ResponseEntity.ok(Map.of("message", "Ausencia eliminada"));
    }

    // --- Weekly schedule management ---

    @GetMapping("/weekly-schedule")
    @Operation(summary = "Obtener horario semanal", description = "Obtiene el horario semanal configurado del psicólogo")
    @ApiResponse(responseCode = "200", description = "Horario obtenido exitosamente")
    public ResponseEntity<List<WeeklyScheduleDtos.DayScheduleDto>> getWeeklySchedule(Principal principal) {
        UserEntity user = currentUser(principal);
        return ResponseEntity.ok(weeklyScheduleService.getSchedule(user.getId()));
    }

    @PutMapping("/weekly-schedule")
    @Transactional
    @Operation(summary = "Guardar horario semanal", description = "Guarda el horario semanal del psicólogo (reemplaza el existente)")
    @ApiResponse(responseCode = "200", description = "Horario guardado exitosamente")
    public ResponseEntity<CalendarDtos.MessageResponse> saveWeeklySchedule(Principal principal,
            @Valid @RequestBody WeeklyScheduleDtos.SaveScheduleRequest req) {
        UserEntity user = currentUser(principal);
        weeklyScheduleService.saveSchedule(user, req.days);
        return ResponseEntity.ok(new CalendarDtos.MessageResponse("Horario semanal guardado exitosamente"));
    }

    @PostMapping("/weekly-schedule/generate")
    @Transactional
    @Operation(summary = "Generar slots desde horario semanal", description = "Genera slots de disponibilidad para las próximas 2 semanas basándose en el horario semanal configurado")
    @ApiResponse(responseCode = "200", description = "Slots generados exitosamente")
    public ResponseEntity<WeeklyScheduleDtos.GenerateResult> generateSlotsNow(Principal principal) {
        UserEntity user = currentUser(principal);
        WeeklyScheduleDtos.GenerateResult result = weeklyScheduleService.generateSlots(user.getId(), 2);
        return ResponseEntity.ok(result);
    }

    // --- iCal export ---

    @GetMapping("/export.ics")
    @Transactional(readOnly = true)
    @Operation(summary = "Exportar citas a iCal", description = "Genera un archivo .ics con las citas del usuario (BOOKED/CONFIRMED)")
    @ApiResponse(responseCode = "200", description = "Archivo ICS generado")
    public ResponseEntity<byte[]> exportIcal(Principal principal) {
        UserEntity user = currentUser(principal);
        List<CalendarDtos.AppointmentListItemDto> appointments = calendarService.getMyAppointments(user);

        DateTimeFormatter icsFormatter = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'")
                .withZone(ZoneId.of("UTC"));

        StringBuilder sb = new StringBuilder();
        sb.append("BEGIN:VCALENDAR\r\n");
        sb.append("VERSION:2.0\r\n");
        sb.append("PRODID:-//Gantly//Citas//ES\r\n");
        sb.append("CALSCALE:GREGORIAN\r\n");
        sb.append("METHOD:PUBLISH\r\n");
        sb.append("X-WR-CALNAME:Mis citas Gantly\r\n");

        for (CalendarDtos.AppointmentListItemDto apt : appointments) {
            if (apt.startTime() == null || apt.endTime() == null) continue;
            String status = apt.status();
            if (status == null) continue;
            // Only export BOOKED or CONFIRMED appointments
            if (!"BOOKED".equals(status) && !"CONFIRMED".equals(status)) continue;

            Instant start = Instant.parse(apt.startTime());
            Instant end = Instant.parse(apt.endTime());
            String psychName = apt.psychologist() != null ? apt.psychologist().name() : "Gantly";

            sb.append("BEGIN:VEVENT\r\n");
            sb.append("UID:gantly-apt-").append(apt.id()).append("@gantly.es\r\n");
            sb.append("DTSTART:").append(icsFormatter.format(start)).append("\r\n");
            sb.append("DTEND:").append(icsFormatter.format(end)).append("\r\n");
            sb.append("SUMMARY:Cita con ").append(escapeIcalText(psychName)).append("\r\n");
            if (apt.notes() != null && !apt.notes().isBlank()) {
                sb.append("DESCRIPTION:").append(escapeIcalText(apt.notes())).append("\r\n");
            }
            sb.append("STATUS:CONFIRMED\r\n");
            sb.append("END:VEVENT\r\n");
        }
        sb.append("END:VCALENDAR\r\n");

        byte[] bytes = sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/calendar; charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", "appointments.ics");
        headers.setContentLength(bytes.length);

        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    private static String escapeIcalText(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                   .replace(";", "\\;")
                   .replace(",", "\\,")
                   .replace("\n", "\\n")
                   .replace("\r", "");
    }
}
