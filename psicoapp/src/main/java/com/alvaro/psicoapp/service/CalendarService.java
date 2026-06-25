package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.config.AppTimezone;
import com.alvaro.psicoapp.domain.AppointmentEntity;
import com.alvaro.psicoapp.domain.AppointmentRatingEntity;
import com.alvaro.psicoapp.domain.AppointmentRequestEntity;
import com.alvaro.psicoapp.domain.AppointmentStatusEnum;
import com.alvaro.psicoapp.domain.PaymentStatusEnum;
import com.alvaro.psicoapp.domain.RequestStatusEnum;
import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.CalendarDtos;
import com.alvaro.psicoapp.domain.PsychAbsenceEntity;
import com.alvaro.psicoapp.repository.AppointmentRatingRepository;
import com.alvaro.psicoapp.repository.AppointmentRepository;
import com.alvaro.psicoapp.repository.AppointmentRequestRepository;
import com.alvaro.psicoapp.repository.PsychAbsenceRepository;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CalendarService {
    private static final Logger logger = LoggerFactory.getLogger(CalendarService.class);
    private static final int MIN_DURATION_MINUTES = 30;
    private static final int MAX_DURATION_MINUTES = 240;

    private final AppointmentRepository appointmentRepository;
    private final AppointmentRequestRepository appointmentRequestRepository;
    private final AppointmentRatingRepository appointmentRatingRepository;
    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;
    private final PsychAbsenceRepository psychAbsenceRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public CalendarService(AppointmentRepository appointmentRepository,
                           AppointmentRequestRepository appointmentRequestRepository,
                           AppointmentRatingRepository appointmentRatingRepository,
                           UserRepository userRepository,
                           UserPsychologistRepository userPsychologistRepository,
                           PsychAbsenceRepository psychAbsenceRepository,
                           EmailService emailService,
                           NotificationService notificationService,
                           AuditService auditService) {
        this.appointmentRepository = appointmentRepository;
        this.appointmentRequestRepository = appointmentRequestRepository;
        this.appointmentRatingRepository = appointmentRatingRepository;
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.psychAbsenceRepository = psychAbsenceRepository;
        this.emailService = emailService;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional
    public List<AppointmentEntity> createSlot(UserEntity psychologist, CalendarDtos.CreateSlotRequest req) {
        requirePsychologist(psychologist);
        validateSlotTimes(req.start, req.end);
        validateNoOverlap(psychologist.getId(), req.start, req.end, null);
        validateNoAbsenceOverlap(psychologist.getId(), req.start, req.end);
        validatePrice(req.price);

        List<AppointmentEntity> created = new ArrayList<>();
        String groupId = null;
        int count = 1;

        if (req.recurrenceRule != null && req.recurrenceCount != null && req.recurrenceCount > 1) {
            groupId = UUID.randomUUID().toString();
            count = Math.min(req.recurrenceCount, 52);
        }

        for (int i = 0; i < count; i++) {
            Instant start = offsetTime(req.start, req.recurrenceRule, i);
            Instant end = offsetTime(req.end, req.recurrenceRule, i);

            if (i > 0) {
                try {
                    validateSlotTimes(start, end);
                    validateNoOverlap(psychologist.getId(), start, end, null);
                    validateNoAbsenceOverlap(psychologist.getId(), start, end);
                } catch (IllegalArgumentException e) {
                    continue; // Skip slots that overlap or are in the past
                }
            }

            AppointmentEntity a = new AppointmentEntity();
            a.setPsychologist(psychologist);
            a.setStartTime(start);
            a.setEndTime(end);
            a.setStatus(AppointmentStatusEnum.FREE);
            a.setPrice(req.price);
            a.setRecurrenceGroupId(groupId);
            a.setRecurrenceRule(req.recurrenceRule);
            if (req.service != null && !req.service.isBlank()) a.setService(req.service);
            if (req.modality != null && !req.modality.isBlank()) a.setModality(req.modality);
            if (req.notes != null && !req.notes.isBlank()) a.setNotes(req.notes);
            if (req.paymentMethod != null && !req.paymentMethod.isBlank()) a.setPaymentMethod(req.paymentMethod);
            calculateTax(a);
            created.add(appointmentRepository.save(a));
        }

        if (!created.isEmpty()) {
            auditService.logCalendarAction("APPOINTMENT_CREATED", created.get(0).getId(), psychologist.getId(), null);
            for (AppointmentEntity c : created) {
                auditService.persistAudit("CREATE_SLOT", "APPOINTMENT", c.getId(),
                        psychologist.getId(), psychologist.getRole(), psychologist.getName(),
                        null, "{\"price\":\"" + (c.getPrice() != null ? c.getPrice().toPlainString() : "null") + "\",\"count\":" + created.size() + "}");
            }
        }
        return created;
    }

    private Instant offsetTime(Instant base, String rule, int index) {
        if (index == 0 || rule == null) return base;
        ZonedDateTime zdt = base.atZone(AppTimezone.APP_ZONE);
        return switch (rule.toUpperCase()) {
            case "WEEKLY" -> zdt.plusWeeks(index).toInstant();
            case "BIWEEKLY" -> zdt.plusWeeks(index * 2L).toInstant();
            case "MONTHLY" -> zdt.plusMonths(index).toInstant();
            default -> base;
        };
    }

    @Transactional
    public CalendarDtos.DeleteRecurrenceResponse deleteRecurrenceGroup(UserEntity psychologist, String groupId) {
        requirePsychologist(psychologist);
        var slots = appointmentRepository.findByRecurrenceGroupId(groupId);
        int deleted = 0, skipped = 0;
        for (var slot : slots) {
            if (!slot.getPsychologist().getId().equals(psychologist.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para eliminar esta serie");
            }
            if (AppointmentStatusEnum.FREE == slot.getStatus()) {
                appointmentRepository.delete(slot);
                deleted++;
            } else {
                skipped++;
            }
        }
        return new CalendarDtos.DeleteRecurrenceResponse(
                "Serie eliminada: " + deleted + " slots eliminados, " + skipped + " omitidos (con reservas)", deleted, skipped);
    }

    @Transactional
    public void deleteSlot(UserEntity psychologist, Long appointmentId) {
        requirePsychologist(psychologist);
        var appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));

        requireOwnership(appointment.getPsychologist().getId(), psychologist.getId(), "eliminar");

        if (AppointmentStatusEnum.CONFIRMED == appointment.getStatus() || AppointmentStatusEnum.BOOKED == appointment.getStatus()) {
            throw new IllegalArgumentException("No puedes eliminar citas confirmadas o reservadas. Usa la opción de cancelar en su lugar.");
        }

        appointmentRequestRepository.findByAppointment_IdAndStatus(appointmentId, RequestStatusEnum.PENDING)
                .forEach(req -> {
                    req.setStatus(RequestStatusEnum.REJECTED);
                    appointmentRequestRepository.save(req);
                    notificationService.createNotification(req.getUser().getId(), "APPOINTMENT",
                        "Horario eliminado", "El horario que solicitaste con " + psychologist.getName() + " ya no está disponible.", appointmentId);
                });
        appointmentRepository.delete(appointment);
        auditService.logCalendarAction("APPOINTMENT_CANCELLED", appointmentId, psychologist.getId(), null);
        auditService.persistAudit("DELETE_SLOT", "APPOINTMENT", appointmentId,
                psychologist.getId(), psychologist.getRole(), psychologist.getName(),
                null, null);
    }

    @Transactional
    public AppointmentEntity updateSlot(UserEntity psychologist, Long appointmentId, CalendarDtos.UpdateSlotRequest req) {
        requirePsychologist(psychologist);
        var appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));

        requireOwnership(appointment.getPsychologist().getId(), psychologist.getId(), "editar");

        if (appointment.getStartTime().isBefore(Instant.now())) {
            throw new IllegalArgumentException("No se pueden editar citas pasadas");
        }

        if (req.price != null) {
            validatePrice(req.price);
            appointment.setPrice(req.price);
            calculateTax(appointment);
        }

        if (req.startTime != null && req.endTime != null) {
            if (AppointmentStatusEnum.FREE != appointment.getStatus()) {
                throw new IllegalArgumentException("No se puede cambiar la hora de una cita que ya tiene solicitudes.");
            }
            boolean hasActiveRequests = appointmentRequestRepository.findByAppointment_Id(appointmentId).stream()
                    .anyMatch(r -> RequestStatusEnum.PENDING == r.getStatus() || RequestStatusEnum.CONFIRMED == r.getStatus());
            if (hasActiveRequests) {
                throw new IllegalArgumentException("No se puede cambiar la hora de una cita que tiene solicitudes pendientes o confirmadas.");
            }
            validateSlotTimes(req.startTime, req.endTime);
            validateNoOverlap(psychologist.getId(), req.startTime, req.endTime, appointmentId);
            appointment.setStartTime(req.startTime);
            appointment.setEndTime(req.endTime);
        }

        var saved = appointmentRepository.save(appointment);
        auditService.logCalendarAction("APPOINTMENT_UPDATED", appointmentId, psychologist.getId(), null);
        auditService.persistAudit("EDIT_SLOT", "APPOINTMENT", appointmentId,
                psychologist.getId(), psychologist.getRole(), psychologist.getName(),
                null, "{\"price\":\"" + (saved.getPrice() != null ? saved.getPrice().toPlainString() : "null") + "\"}");
        return saved;
    }

    public List<AppointmentEntity> getMySlots(UserEntity psychologist, Instant from, Instant to) {
        requirePsychologist(psychologist);
        Instant now = Instant.now();
        return appointmentRepository.findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(psychologist.getId(), from, to)
                .stream()
                .filter(s -> isTodayOrFuture(s.getStartTime(), now))
                .collect(Collectors.toList());
    }

    public List<AppointmentEntity> getAvailability(UserEntity user, Instant from, Instant to) {
        var rel = userPsychologistRepository.findByUserId(user.getId());
        if (rel.isEmpty()) return List.of();

        Instant now = Instant.now();
        var slots = appointmentRepository.findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(
                        rel.get().getPsychologist().getId(), from, to)
                .stream()
                .filter(s -> isTodayOrFuture(s.getStartTime(), now))
                .filter(s -> isVisibleToUser(s, user))
                .collect(Collectors.toList());
        return slots;
    }

    @Transactional(readOnly = true)
    public List<CalendarDtos.AppointmentListItemDto> getMyAppointments(UserEntity user) {
        Instant now = Instant.now();
        List<CalendarDtos.AppointmentListItemDto> result = new ArrayList<>();
        var confirmed = appointmentRepository.findByUser_IdOrderByStartTimeAsc(user.getId())
                .stream()
                .filter(apt -> (AppointmentStatusEnum.CONFIRMED == apt.getStatus() || AppointmentStatusEnum.BOOKED == apt.getStatus())
                        && isTodayOrFuture(apt.getStartTime(), now))
                .map(this::toAppointmentListItemDto)
                .collect(Collectors.toList());
        var pending = appointmentRequestRepository.findByUser_IdOrderByRequestedAtDesc(user.getId())
                .stream()
                .filter(req -> RequestStatusEnum.PENDING == req.getStatus())
                .map(this::toRequestedAppointmentListItemDto)
                .collect(Collectors.toList());
        result.addAll(confirmed);
        result.addAll(pending);
        result.sort(Comparator.comparing(CalendarDtos.AppointmentListItemDto::startTime, Comparator.nullsLast(Comparator.naturalOrder())));
        return result;
    }

    @Transactional
    public void bookAppointment(UserEntity user, Long appointmentId) {
        var appt = appointmentRepository.findByIdForUpdate(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));

        if (AppointmentStatusEnum.FREE != appt.getStatus() && AppointmentStatusEnum.REQUESTED != appt.getStatus()) {
            throw new IllegalArgumentException("Esta cita ya no está disponible");
        }

        if (appointmentRequestRepository.findByAppointment_IdAndUser_Id(appointmentId, user.getId()).isPresent()) {
            throw new IllegalArgumentException("Ya has solicitado esta cita");
        }

        var request = new AppointmentRequestEntity();
        request.setAppointment(appt);
        request.setUser(user);
        request.setStatus(RequestStatusEnum.PENDING);
        appointmentRequestRepository.save(request);

        if (AppointmentStatusEnum.FREE == appt.getStatus()) {
            appt.setStatus(AppointmentStatusEnum.REQUESTED);
            appointmentRepository.save(appt);
        }

        notificationService.createNotification(appt.getPsychologist().getId(), "APPOINTMENT",
            "Nueva solicitud de cita", user.getName() + " ha solicitado una cita contigo.", appt.getId());

        auditService.logCalendarAction("APPOINTMENT_BOOKED", appointmentId, appt.getPsychologist().getId(), user.getId());
        auditService.persistAudit("BOOK_APPOINTMENT", "APPOINTMENT", appointmentId,
                user.getId(), user.getRole(), user.getName(),
                appt.getPsychologist().getId(), null);
    }

    @Transactional(readOnly = true)
    public List<CalendarDtos.PendingRequestDto> getPendingRequests(UserEntity psychologist) {
        requirePsychologist(psychologist);
        return appointmentRequestRepository.findPendingByPsychologist_Id(psychologist.getId())
                .stream()
                .map(this::toPendingRequestDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void confirmAppointment(UserEntity psychologist, Long requestId) {
        requirePsychologist(psychologist);
        var request = appointmentRequestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no encontrada"));
        var appointment = request.getAppointment();

        requireOwnership(appointment.getPsychologist().getId(), psychologist.getId(), "confirmar");

        if (RequestStatusEnum.PENDING != request.getStatus()) {
            throw new IllegalArgumentException("Esta solicitud ya fue procesada");
        }

        // Prevent double-booking: check no active appointment exists for the same psychologist/time
        if (appointmentRepository.existsActiveAppointment(appointment.getPsychologist().getId(), appointment.getStartTime())) {
            throw new IllegalArgumentException("Este horario ya está reservado");
        }

        appointmentRequestRepository.findByAppointment_Id(appointment.getId()).forEach(req -> {
            if (req.getId().equals(requestId)) {
                req.setStatus(RequestStatusEnum.CONFIRMED);
            } else {
                req.setStatus(RequestStatusEnum.REJECTED);
                notificationService.createNotification(req.getUser().getId(), "APPOINTMENT",
                    "Solicitud rechazada", "Tu solicitud de cita con " + psychologist.getName() + " no ha sido aceptada.", appointment.getId());
            }
            appointmentRequestRepository.save(req);
        });

        Instant now = Instant.now();
        appointment.setStatus(AppointmentStatusEnum.CONFIRMED);
        appointment.setUser(request.getUser());
        appointment.setConfirmedAt(now);
        appointment.setConfirmedByUser(request.getUser());
        appointment.setPaymentDeadline(now.plusSeconds(48 * 60 * 60));
        appointment.setPaymentStatus(PaymentStatusEnum.PENDING);
        appointmentRepository.save(appointment);

        try {
            emailService.sendAppointmentConfirmationEmail(
                    request.getUser().getEmail(), request.getUser().getName(), psychologist.getName(),
                    appointment.getStartTime(), appointment.getPaymentDeadline(), appointment.getPrice());
        } catch (Exception e) {
            logger.error("Error enviando email de confirmación", e);
        }

        notificationService.createNotification(request.getUser().getId(), "APPOINTMENT",
            "Cita confirmada", "Tu cita con " + psychologist.getName() + " ha sido confirmada.", appointment.getId());

        auditService.logCalendarAction("APPOINTMENT_CONFIRMED", appointment.getId(), psychologist.getId(), request.getUser().getId());
        auditService.persistAudit("CONFIRM_APPOINTMENT", "APPOINTMENT", appointment.getId(),
                psychologist.getId(), psychologist.getRole(), psychologist.getName(),
                request.getUser().getId(), null);
    }

    @Transactional
    public void cancelAppointment(UserEntity psychologist, Long appointmentId) {
        requirePsychologist(psychologist);
        var appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));

        requireOwnership(appointment.getPsychologist().getId(), psychologist.getId(), "cancelar");

        if (AppointmentStatusEnum.CANCELLED == appointment.getStatus()) {
            throw new IllegalArgumentException("Esta cita ya está cancelada");
        }

        appointmentRequestRepository.findByAppointment_IdAndStatus(appointmentId, RequestStatusEnum.PENDING)
                .forEach(req -> {
                    req.setStatus(RequestStatusEnum.REJECTED);
                    appointmentRequestRepository.save(req);
                });
        appointment.setStatus(AppointmentStatusEnum.CANCELLED);
        appointmentRepository.save(appointment);
        auditService.logCalendarAction("APPOINTMENT_CANCELLED", appointmentId, psychologist.getId(),
                appointment.getUser() != null ? appointment.getUser().getId() : null);
        auditService.persistAudit("CANCEL_APPOINTMENT", "APPOINTMENT", appointmentId,
                psychologist.getId(), psychologist.getRole(), psychologist.getName(),
                appointment.getUser() != null ? appointment.getUser().getId() : null, null);

        if (appointment.getUser() != null) {
            notificationService.createNotification(appointment.getUser().getId(), "APPOINTMENT",
                "Cita cancelada", "Tu cita con " + psychologist.getName() + " ha sido cancelada.", appointment.getId());

            try {
                emailService.sendAppointmentCancellationEmail(
                    appointment.getUser().getEmail(), appointment.getUser().getName(),
                    psychologist.getName(), appointment.getStartTime());
            } catch (Exception e) {
                logger.error("Error enviando email de cancelación", e);
            }
        }
    }

    @Transactional
    public CalendarDtos.MessageResponse rescheduleAppointment(UserEntity user, Long appointmentId, CalendarDtos.RescheduleAppointmentRequest req) {
        var appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));

        // Only BOOKED or CONFIRMED appointments can be rescheduled
        if (appointment.getStatus() != AppointmentStatusEnum.BOOKED && appointment.getStatus() != AppointmentStatusEnum.CONFIRMED) {
            throw new IllegalArgumentException("Solo se pueden reagendar citas confirmadas o reservadas");
        }

        // Verify the requesting user is either the patient or the psychologist
        boolean isPatient = appointment.getUser() != null && appointment.getUser().getId().equals(user.getId());
        boolean isPsychologist = appointment.getPsychologist().getId().equals(user.getId());
        if (!isPatient && !isPsychologist) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para reagendar esta cita");
        }

        // Validate new times
        validateSlotTimes(req.newStartTime, req.newEndTime);
        validateNoOverlap(appointment.getPsychologist().getId(), req.newStartTime, req.newEndTime, appointmentId);

        Instant oldStart = appointment.getStartTime();
        appointment.setStartTime(req.newStartTime);
        appointment.setEndTime(req.newEndTime);
        appointmentRepository.save(appointment);

        auditService.logCalendarAction("APPOINTMENT_RESCHEDULED", appointmentId, user.getId(),
                isPatient ? appointment.getPsychologist().getId() : (appointment.getUser() != null ? appointment.getUser().getId() : null));
        auditService.persistAudit("RESCHEDULE_APPOINTMENT", "APPOINTMENT", appointmentId,
                user.getId(), user.getRole(), user.getName(),
                isPatient ? appointment.getPsychologist().getId() : (appointment.getUser() != null ? appointment.getUser().getId() : null), null);

        // Notify the other party
        String formattedNew = req.newStartTime.atZone(com.alvaro.psicoapp.config.AppTimezone.APP_ZONE)
                .format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        if (isPatient && appointment.getPsychologist() != null) {
            notificationService.createNotification(appointment.getPsychologist().getId(), "APPOINTMENT",
                    "Cita reagendada",
                    user.getName() + " ha reagendado su cita al " + formattedNew, appointment.getId());
        } else if (isPsychologist && appointment.getUser() != null) {
            notificationService.createNotification(appointment.getUser().getId(), "APPOINTMENT",
                    "Cita reagendada",
                    appointment.getPsychologist().getName() + " ha reagendado tu cita al " + formattedNew, appointment.getId());
        }

        return new CalendarDtos.MessageResponse("Cita reagendada exitosamente");
    }

    @Transactional
    public CalendarDtos.CreateForPatientResponse createForPatient(UserEntity psychologist, CalendarDtos.CreateForPatientRequest req) {
        requirePsychologist(psychologist);
        validateSlotTimes(req.start, req.end);
        validateNoOverlap(psychologist.getId(), req.start, req.end, null);

        var rel = userPsychologistRepository.findByUserId(req.userId);
        if (rel.isEmpty() || !rel.get().getPsychologist().getId().equals(psychologist.getId())) {
            throw new IllegalArgumentException("Este usuario no es tu paciente");
        }

        var user = userRepository.findById(req.userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        // Prevent double-booking: check no active appointment exists for the same psychologist/time
        if (appointmentRepository.existsActiveAppointment(psychologist.getId(), req.start)) {
            throw new IllegalArgumentException("Este horario ya está reservado");
        }

        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setPsychologist(psychologist);
        appointment.setUser(user);
        appointment.setStartTime(req.start);
        appointment.setEndTime(req.end);
        appointment.setStatus(AppointmentStatusEnum.CONFIRMED);
        appointment.setPrice(req.price);
        if (req.service != null && !req.service.isBlank()) appointment.setService(req.service);
        if (req.modality != null && !req.modality.isBlank()) appointment.setModality(req.modality);
        if (req.notes != null && !req.notes.isBlank()) appointment.setNotes(req.notes);
        calculateTax(appointment);
        Instant now = Instant.now();
        appointment.setConfirmedAt(now);
        appointment.setConfirmedByUser(user);
        appointment.setPaymentDeadline(null);
        appointment.setPaymentStatus(PaymentStatusEnum.PENDING);

        var saved = appointmentRepository.save(appointment);
        auditService.logCalendarAction("APPOINTMENT_CREATED", saved.getId(), psychologist.getId(), user.getId());
        auditService.persistAudit("CREATE_APPOINTMENT", "APPOINTMENT", saved.getId(),
                psychologist.getId(), psychologist.getRole(), psychologist.getName(),
                user.getId(), "{\"price\":\"" + (saved.getPrice() != null ? saved.getPrice().toPlainString() : "null") + "\"}");

        try {
            emailService.sendAppointmentConfirmationEmail(
                    user.getEmail(), user.getName(), psychologist.getName(),
                    appointment.getStartTime(), null, appointment.getPrice());
        } catch (Exception e) {
            logger.error("Error enviando email de confirmación", e);
        }

        notificationService.createNotification(user.getId(), "APPOINTMENT",
            "Nueva cita programada", psychologist.getName() + " ha programado una cita contigo.", saved.getId());

        return new CalendarDtos.CreateForPatientResponse(
                saved.getId(), saved.getStartTime().toString(), saved.getEndTime().toString(),
                saved.getStatus().name(), user.getId(), psychologist.getId()
        );
    }

    @Transactional
    public CalendarDtos.InternalSlotResponse createInternalSlot(UserEntity psychologist, CalendarDtos.CreateInternalSlotRequest req) {
        requirePsychologist(psychologist);
        validateSlotTimes(req.start, req.end);
        validateNoOverlap(psychologist.getId(), req.start, req.end, null);

        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setPsychologist(psychologist);
        appointment.setStartTime(req.start);
        appointment.setEndTime(req.end);
        appointment.setService("INTERNAL");

        if (req.notes != null && !req.notes.isBlank()) {
            appointment.setNotes(req.notes.trim().length() > 500 ? req.notes.trim().substring(0, 500) : req.notes.trim());
        }

        if (req.userId != null) {
            var rel = userPsychologistRepository.findByUserId(req.userId);
            if (rel.isEmpty() || !rel.get().getPsychologist().getId().equals(psychologist.getId())) {
                throw new IllegalArgumentException("Este usuario no es tu paciente");
            }
            var user = userRepository.findById(req.userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
            appointment.setUser(user);
            appointment.setStatus(AppointmentStatusEnum.BOOKED);
            appointment.setPaymentStatus(PaymentStatusEnum.PAID);
        } else {
            appointment.setStatus(AppointmentStatusEnum.BOOKED);
            appointment.setPaymentStatus(PaymentStatusEnum.PAID);
        }

        appointment.setConfirmedAt(Instant.now());
        var saved = appointmentRepository.save(appointment);
        auditService.logCalendarAction("INTERNAL_SLOT_CREATED", saved.getId(), psychologist.getId(),
                req.userId != null ? req.userId : psychologist.getId());

        return new CalendarDtos.InternalSlotResponse(
                saved.getId(), saved.getStartTime().toString(), saved.getEndTime().toString(),
                saved.getStatus().name(), saved.getNotes(), req.userId);
    }

    @Transactional(readOnly = true)
    public List<CalendarDtos.PastAppointmentDto> getPastAppointments(UserEntity user) {
        Instant now = Instant.now();
        return appointmentRepository.findByUser_IdOrderByStartTimeAsc(user.getId())
                .stream()
                .filter(apt -> (AppointmentStatusEnum.CONFIRMED == apt.getStatus() || AppointmentStatusEnum.BOOKED == apt.getStatus()) && apt.getEndTime().isBefore(now))
                .map(apt -> toPastAppointmentDto(apt, user.getId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public CalendarDtos.RateAppointmentResponse rateAppointment(UserEntity user, Long appointmentId, CalendarDtos.RateAppointmentRequest req) {
        var appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));

        if (appointment.getUser() == null || !appointment.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para valorar esta cita");
        }
        if (appointment.getEndTime().isAfter(Instant.now())) {
            throw new IllegalArgumentException("Solo puedes valorar citas que ya han finalizado");
        }
        if (req.rating == null || req.rating < 1 || req.rating > 5) {
            throw new IllegalArgumentException("La valoración debe estar entre 1 y 5");
        }

        var existing = appointmentRatingRepository.findByAppointment_IdAndUser_Id(appointmentId, user.getId());
        AppointmentRatingEntity rating = existing.orElseGet(() -> {
            var r = new AppointmentRatingEntity();
            r.setAppointment(appointment);
            r.setUser(user);
            r.setPsychologist(appointment.getPsychologist());
            return r;
        });

        rating.setRating(req.rating);
        rating.setComment(req.comment);
        rating.setUpdatedAt(Instant.now());
        appointmentRatingRepository.save(rating);

        var ratingDto = new CalendarDtos.RatingDto(rating.getId(), rating.getRating(),
                rating.getComment() != null ? rating.getComment() : "", null);
        return new CalendarDtos.RateAppointmentResponse("Valoración guardada exitosamente", ratingDto);
    }

    @Transactional(readOnly = true)
    public CalendarDtos.PsychologistRatingResponse getPsychologistRating(Long psychologistId) {
        var psychologist = userRepository.findById(psychologistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Psicólogo no encontrado"));
        if (!RoleConstants.PSYCHOLOGIST.equals(psychologist.getRole())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Psicólogo no encontrado");
        }
        Double avg = appointmentRatingRepository.findAverageRatingByPsychologistId(psychologistId);
        long total = appointmentRatingRepository.countByPsychologistId(psychologistId);
        return new CalendarDtos.PsychologistRatingResponse(
                avg != null ? Math.round(avg * 10.0) / 10.0 : null, total);
    }

    @Transactional(readOnly = true)
    public List<CalendarDtos.PsychologistRatingDetailDto> getPsychologistRatings(Long psychologistId) {
        var psychologist = userRepository.findById(psychologistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Psicólogo no encontrado"));
        if (!RoleConstants.PSYCHOLOGIST.equals(psychologist.getRole())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Psicólogo no encontrado");
        }
        return appointmentRatingRepository.findByPsychologist_IdOrderByCreatedAtDesc(psychologistId)
                .stream()
                .map(r -> new CalendarDtos.PsychologistRatingDetailDto(
                        r.getRating(),
                        r.getComment() != null ? r.getComment() : "",
                        r.getUser() != null ? r.getUser().getName() : "Anónimo",
                        r.getCreatedAt() != null ? r.getCreatedAt().toString() : ""
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CalendarDtos.PsychologistPastAppointmentDto> getPsychologistPastAppointments(UserEntity psychologist) {
        requirePsychologist(psychologist);
        Instant now = Instant.now();
        return appointmentRepository.findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(
                        psychologist.getId(), Instant.ofEpochMilli(0), now)
                .stream()
                .filter(apt -> (AppointmentStatusEnum.CONFIRMED == apt.getStatus() || AppointmentStatusEnum.BOOKED == apt.getStatus())
                        && apt.getEndTime().isBefore(now) && apt.getUser() != null)
                .map(this::toPsychologistPastAppointmentDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CalendarDtos.PsychologistPastAppointmentDto> getBillingAppointments(UserEntity psychologist) {
        requirePsychologist(psychologist);
        return appointmentRepository.findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(
                        psychologist.getId(), Instant.ofEpochMilli(0), Instant.now().plusSeconds(365L * 24 * 3600))
                .stream()
                .filter(apt -> (AppointmentStatusEnum.CONFIRMED == apt.getStatus() || AppointmentStatusEnum.BOOKED == apt.getStatus())
                        && apt.getUser() != null)
                .map(this::toPsychologistPastAppointmentDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<CalendarDtos.PsychologistPastAppointmentDto> getBillingAppointmentsPaged(UserEntity psychologist, Pageable pageable) {
        requirePsychologist(psychologist);
        Instant fromTime = Instant.ofEpochMilli(0);
        Instant toTime = Instant.now().plusSeconds(365L * 24 * 3600);
        Page<AppointmentEntity> page = appointmentRepository.findBillingAppointments(
                psychologist.getId(), fromTime, toTime, pageable);
        return page.map(this::toPsychologistPastAppointmentDto);
    }

    @Transactional
    public void updateAppointmentNotes(Long appointmentId, String notes, UserEntity psychologist) {
        requirePsychologist(psychologist);
        var appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));
        requireOwnership(appointment.getPsychologist().getId(), psychologist.getId(), "editar notas de");
        if (!appointment.getEndTime().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Solo puedes añadir notas a citas que ya han finalizado");
        }
        if (notes != null && notes.length() > 500) {
            throw new IllegalArgumentException("Las notas no pueden superar los 500 caracteres");
        }
        appointment.setNotes(notes);
        appointmentRepository.save(appointment);
    }

    @Transactional(readOnly = true)
    public String getAppointmentNotes(Long appointmentId, UserEntity psychologist) {
        requirePsychologist(psychologist);
        var appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));
        requireOwnership(appointment.getPsychologist().getId(), psychologist.getId(), "ver notas de");
        return appointment.getNotes();
    }

    // --- Absence management ---

    @Transactional
    public PsychAbsenceEntity createAbsence(UserEntity psychologist, Instant start, Instant end, String reason) {
        requirePsychologist(psychologist);
        if (!end.isAfter(start)) throw new IllegalArgumentException("La fecha de fin debe ser posterior a la de inicio");

        var overlapping = psychAbsenceRepository.findOverlapping(psychologist.getId(), start, end);
        if (!overlapping.isEmpty()) throw new IllegalArgumentException("Ya existe una ausencia en ese periodo");

        PsychAbsenceEntity absence = new PsychAbsenceEntity();
        absence.setPsychologist(psychologist);
        absence.setStartTime(start);
        absence.setEndTime(end);
        absence.setReason(reason);
        var saved = psychAbsenceRepository.save(absence);
        auditService.persistAudit("CREATE_ABSENCE", "ABSENCE", saved.getId(),
                psychologist.getId(), psychologist.getRole(), psychologist.getName(),
                null, "{\"reason\":\"" + (reason != null ? reason.replace("\"", "'") : "") + "\"}");

        // Process overlapping appointments
        var slots = appointmentRepository.findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(
                psychologist.getId(), start, end);
        for (var slot : slots) {
            if (!slot.getStartTime().isBefore(end) || !slot.getEndTime().isAfter(start)) continue;

            if (AppointmentStatusEnum.FREE == slot.getStatus()) {
                // Cancel overlapping FREE slots
                appointmentRepository.delete(slot);
            } else if ((AppointmentStatusEnum.BOOKED == slot.getStatus()
                        || AppointmentStatusEnum.CONFIRMED == slot.getStatus())
                       && slot.getUser() != null) {
                // Notify patients with BOOKED/CONFIRMED appointments
                String patientName = slot.getUser().getName();
                String psychName = psychologist.getName();
                notificationService.createNotification(slot.getUser().getId(), "APPOINTMENT",
                        "Ausencia de tu psicólogo",
                        psychName + " ha marcado ausencia durante tu cita del "
                                + slot.getStartTime().atZone(AppTimezone.APP_ZONE)
                                    .format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy 'a las' HH:mm"))
                                + ". Por favor, contacta para reprogramar.", slot.getId());
                try {
                    emailService.sendAppointmentCancellationEmail(
                            slot.getUser().getEmail(), patientName, psychName, slot.getStartTime());
                } catch (Exception e) {
                    logger.error("Error enviando email de ausencia al paciente {}", slot.getUser().getEmail(), e);
                }
                logger.info("Psychologist {} has marked absence during appointment on {} for patient {}",
                        psychName, slot.getStartTime(), patientName);
            }
        }
        return saved;
    }

    @Transactional(readOnly = true)
    public List<PsychAbsenceEntity> getAbsences(UserEntity psychologist) {
        requirePsychologist(psychologist);
        return psychAbsenceRepository.findByPsychologist_IdAndEndTimeAfterOrderByStartTimeAsc(
                psychologist.getId(), Instant.now());
    }

    @Transactional
    public void deleteAbsence(UserEntity psychologist, Long absenceId) {
        requirePsychologist(psychologist);
        var absence = psychAbsenceRepository.findById(absenceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ausencia no encontrada"));
        if (!absence.getPsychologist().getId().equals(psychologist.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para eliminar esta ausencia");
        }
        psychAbsenceRepository.delete(absence);
        auditService.persistAudit("DELETE_ABSENCE", "ABSENCE", absenceId,
                psychologist.getId(), psychologist.getRole(), psychologist.getName(),
                null, null);
    }

    private void validateNoAbsenceOverlap(Long psychologistId, Instant start, Instant end) {
        var absences = psychAbsenceRepository.findOverlapping(psychologistId, start, end);
        if (!absences.isEmpty()) {
            throw new IllegalArgumentException("No se pueden crear citas durante un periodo de ausencia");
        }
    }

    private void calculateTax(AppointmentEntity appointment) {
        if (appointment.getPrice() == null) return;

        if (Boolean.TRUE.equals(appointment.getTaxExempt())) {
            appointment.setTaxRate(BigDecimal.ZERO);
            appointment.setTaxAmount(BigDecimal.ZERO);
            appointment.setTotalAmount(appointment.getPrice());
        } else {
            BigDecimal rate = appointment.getTaxRate() != null ? appointment.getTaxRate() : new BigDecimal("0.21");
            appointment.setTaxRate(rate);
            appointment.setTaxAmount(appointment.getPrice().multiply(rate).setScale(2, RoundingMode.HALF_UP));
            appointment.setTotalAmount(appointment.getPrice().add(appointment.getTaxAmount()));
        }
    }

    private void requirePsychologist(UserEntity user) {
        if (!RoleConstants.PSYCHOLOGIST.equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private void requireOwnership(Long ownerId, Long currentUserId, String action) {
        if (!ownerId.equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para " + action + " esta cita");
        }
    }

    private void validateSlotTimes(Instant start, Instant end) {
        Instant now = Instant.now();
        if (start.isBefore(now)) throw new IllegalArgumentException("No se pueden crear citas en el pasado");
        if (!end.isAfter(start)) throw new IllegalArgumentException("La hora de fin debe ser posterior a la hora de inicio");
        long minutes = Duration.between(start, end).toMinutes();
        if (minutes < MIN_DURATION_MINUTES) throw new IllegalArgumentException("La duración mínima de una cita es de 30 minutos");
        if (minutes > MAX_DURATION_MINUTES) throw new IllegalArgumentException("La duración máxima de una cita es de 4 horas");
    }

    private void validateNoOverlap(Long psychologistId, Instant start, Instant end, Long excludeAppointmentId) {
        var existing = appointmentRepository.findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(
                psychologistId, start.minusSeconds(1), end.plusSeconds(1));
        boolean overlap = existing.stream()
                .filter(apt -> excludeAppointmentId == null || !apt.getId().equals(excludeAppointmentId))
                .anyMatch(apt -> AppointmentStatusEnum.CANCELLED != apt.getStatus()
                        && start.isBefore(apt.getEndTime()) && end.isAfter(apt.getStartTime()));
        if (overlap) throw new IllegalArgumentException("Ya existe una cita en este horario");
    }

    private void validatePrice(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El precio debe ser mayor a 0");
        }
    }

    private boolean isTodayOrFuture(Instant instant, Instant now) {
        return instant.isAfter(now) || instant.atZone(AppTimezone.APP_ZONE).toLocalDate()
                .equals(now.atZone(AppTimezone.APP_ZONE).toLocalDate());
    }

    private boolean isVisibleToUser(AppointmentEntity s, UserEntity user) {
        if (AppointmentStatusEnum.FREE == s.getStatus() || AppointmentStatusEnum.REQUESTED == s.getStatus()) return true;
        if ((AppointmentStatusEnum.CONFIRMED == s.getStatus() || AppointmentStatusEnum.BOOKED == s.getStatus())
                && s.getUser() != null && s.getUser().getId().equals(user.getId())) return true;
        return false;
    }

    private CalendarDtos.AppointmentListItemDto toAppointmentListItemDto(AppointmentEntity apt) {
        var psych = apt.getPsychologist() != null
                ? new CalendarDtos.PsychologistSummary(apt.getPsychologist().getId(), apt.getPsychologist().getName(), apt.getPsychologist().getEmail())
                : null;
        return new CalendarDtos.AppointmentListItemDto(
                apt.getId(), null,
                apt.getStartTime() != null ? apt.getStartTime().toString() : null,
                apt.getEndTime() != null ? apt.getEndTime().toString() : null,
                apt.getStatus() != null ? apt.getStatus().name() : null, apt.getPrice(),
                apt.getPaymentStatus() != null ? apt.getPaymentStatus().name() : null,
                apt.getPaymentDeadline() != null ? apt.getPaymentDeadline().toString() : null,
                apt.getConfirmedAt() != null ? apt.getConfirmedAt().toString() : null,
                null, psych, apt.getNotes());
    }

    private CalendarDtos.AppointmentListItemDto toRequestedAppointmentListItemDto(AppointmentRequestEntity req) {
        var apt = req.getAppointment();
        var psych = apt.getPsychologist() != null
                ? new CalendarDtos.PsychologistSummary(apt.getPsychologist().getId(), apt.getPsychologist().getName(), apt.getPsychologist().getEmail())
                : null;
        return new CalendarDtos.AppointmentListItemDto(
                apt.getId(), req.getId(),
                apt.getStartTime() != null ? apt.getStartTime().toString() : null,
                apt.getEndTime() != null ? apt.getEndTime().toString() : null,
                AppointmentStatusEnum.REQUESTED.name(), apt.getPrice(),
                null, null, null, req.getRequestedAt().toString(), psych, apt.getNotes());
    }

    private CalendarDtos.PendingRequestDto toPendingRequestDto(AppointmentRequestEntity req) {
        var user = new CalendarDtos.PendingUserDto(req.getUser().getId(), req.getUser().getName(), req.getUser().getEmail());
        var apt = req.getAppointment();
        var appointment = new CalendarDtos.PendingAppointmentDto(apt.getId(),
                apt.getStartTime().toString(), apt.getEndTime().toString(), apt.getPrice());
        return new CalendarDtos.PendingRequestDto(req.getId(), apt.getId(), req.getRequestedAt().toString(),
                req.getStatus() != null ? req.getStatus().name() : null, user, appointment);
    }

    private CalendarDtos.PastAppointmentDto toPastAppointmentDto(AppointmentEntity apt, Long userId) {
        var psych = new CalendarDtos.PsychologistSummary(apt.getPsychologist().getId(), apt.getPsychologist().getName(), apt.getPsychologist().getEmail());
        var rating = appointmentRatingRepository.findByAppointment_IdAndUser_Id(apt.getId(), userId)
                .map(r -> new CalendarDtos.RatingDto(r.getId(), r.getRating(), r.getComment() != null ? r.getComment() : "", r.getCreatedAt() != null ? r.getCreatedAt().toString() : null))
                .orElse(null);
        return new CalendarDtos.PastAppointmentDto(apt.getId(), apt.getStartTime(), apt.getEndTime(), apt.getStatus() != null ? apt.getStatus().name() : null, apt.getPrice(), psych, rating, apt.getNotes());
    }

    private CalendarDtos.PsychologistPastAppointmentDto toPsychologistPastAppointmentDto(AppointmentEntity apt) {
        var user = new CalendarDtos.PastUserDto(apt.getUser().getId(), apt.getUser().getName(), apt.getUser().getEmail());
        var rating = appointmentRatingRepository.findByAppointment_IdAndUser_Id(apt.getId(), apt.getUser().getId())
                .map(r -> new CalendarDtos.RatingDto(r.getId(), r.getRating(), r.getComment() != null ? r.getComment() : "", r.getCreatedAt() != null ? r.getCreatedAt().toString() : null))
                .orElse(null);
        return new CalendarDtos.PsychologistPastAppointmentDto(apt.getId(), apt.getStartTime(), apt.getEndTime(), apt.getStatus() != null ? apt.getStatus().name() : null, apt.getPrice(), apt.getPaymentStatus() != null ? apt.getPaymentStatus().name() : null, apt.getConfirmedAt(), user, rating,
                apt.getTaxRate(), apt.getTaxAmount(), apt.getTotalAmount(), apt.getTaxExempt());
    }
}
