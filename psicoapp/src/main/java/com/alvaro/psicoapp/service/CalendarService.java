package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.AppointmentEntity;
import com.alvaro.psicoapp.domain.AppointmentRatingEntity;
import com.alvaro.psicoapp.domain.AppointmentRequestEntity;
import com.alvaro.psicoapp.domain.AppointmentStatus;
import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.CalendarDtos;
import com.alvaro.psicoapp.repository.AppointmentRatingRepository;
import com.alvaro.psicoapp.repository.AppointmentRepository;
import com.alvaro.psicoapp.repository.AppointmentRequestRepository;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
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
    private final EmailService emailService;

    public CalendarService(AppointmentRepository appointmentRepository,
                           AppointmentRequestRepository appointmentRequestRepository,
                           AppointmentRatingRepository appointmentRatingRepository,
                           UserRepository userRepository,
                           UserPsychologistRepository userPsychologistRepository,
                           EmailService emailService) {
        this.appointmentRepository = appointmentRepository;
        this.appointmentRequestRepository = appointmentRequestRepository;
        this.appointmentRatingRepository = appointmentRatingRepository;
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.emailService = emailService;
    }

    @Transactional
    public AppointmentEntity createSlot(UserEntity psychologist, CalendarDtos.CreateSlotRequest req) {
        requirePsychologist(psychologist);
        validateSlotTimes(req.start, req.end);
        validateNoOverlap(psychologist.getId(), req.start, req.end, null);
        validatePrice(req.price);

        AppointmentEntity a = new AppointmentEntity();
        a.setPsychologist(psychologist);
        a.setStartTime(req.start);
        a.setEndTime(req.end);
        a.setStatus(AppointmentStatus.FREE);
        a.setPrice(req.price);
        return appointmentRepository.save(a);
    }

    @Transactional
    public void deleteSlot(UserEntity psychologist, Long appointmentId) {
        requirePsychologist(psychologist);
        var appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));

        requireOwnership(appointment.getPsychologist().getId(), psychologist.getId(), "eliminar");

        if (AppointmentStatus.CONFIRMED.equals(appointment.getStatus()) || AppointmentStatus.BOOKED.equals(appointment.getStatus())) {
            throw new IllegalArgumentException("No puedes eliminar citas confirmadas o reservadas. Usa la opción de cancelar en su lugar.");
        }

        appointmentRequestRepository.findByAppointment_IdAndStatus(appointmentId, AppointmentStatus.REQUEST_PENDING)
                .forEach(req -> {
                    req.setStatus(AppointmentStatus.REQUEST_REJECTED);
                    appointmentRequestRepository.save(req);
                });
        appointmentRepository.delete(appointment);
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
        }

        if (req.startTime != null && req.endTime != null) {
            if (!AppointmentStatus.FREE.equals(appointment.getStatus())) {
                throw new IllegalArgumentException("No se puede cambiar la hora de una cita que ya tiene solicitudes.");
            }
            boolean hasActiveRequests = appointmentRequestRepository.findByAppointment_Id(appointmentId).stream()
                    .anyMatch(r -> AppointmentStatus.REQUEST_PENDING.equals(r.getStatus()) || AppointmentStatus.REQUEST_CONFIRMED.equals(r.getStatus()));
            if (hasActiveRequests) {
                throw new IllegalArgumentException("No se puede cambiar la hora de una cita que tiene solicitudes pendientes o confirmadas.");
            }
            validateSlotTimes(req.startTime, req.endTime);
            validateNoOverlap(psychologist.getId(), req.startTime, req.endTime, appointmentId);
            appointment.setStartTime(req.startTime);
            appointment.setEndTime(req.endTime);
        }

        return appointmentRepository.save(appointment);
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
                .filter(apt -> ("CONFIRMED".equals(apt.getStatus()) || "BOOKED".equals(apt.getStatus()))
                        && isTodayOrFuture(apt.getStartTime(), now))
                .map(this::toAppointmentListItemDto)
                .collect(Collectors.toList());
        var pending = appointmentRequestRepository.findByUser_IdOrderByRequestedAtDesc(user.getId())
                .stream()
                .filter(req -> "PENDING".equals(req.getStatus()))
                .map(this::toRequestedAppointmentListItemDto)
                .collect(Collectors.toList());
        result.addAll(confirmed);
        result.addAll(pending);
        result.sort(Comparator.comparing(CalendarDtos.AppointmentListItemDto::startTime, Comparator.nullsLast(Comparator.naturalOrder())));
        return result;
    }

    @Transactional
    public void bookAppointment(UserEntity user, Long appointmentId) {
        var appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));

        if (!"FREE".equals(appt.getStatus()) && !"REQUESTED".equals(appt.getStatus())) {
            throw new IllegalArgumentException("Esta cita ya no está disponible");
        }

        if (appointmentRequestRepository.findByAppointment_IdAndUser_Id(appointmentId, user.getId()).isPresent()) {
            throw new IllegalArgumentException("Ya has solicitado esta cita");
        }

        var request = new AppointmentRequestEntity();
        request.setAppointment(appt);
        request.setUser(user);
        request.setStatus("PENDING");
        appointmentRequestRepository.save(request);

        if ("FREE".equals(appt.getStatus())) {
            appt.setStatus("REQUESTED");
            appointmentRepository.save(appt);
        }
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
        var request = appointmentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no encontrada"));
        var appointment = request.getAppointment();

        requireOwnership(appointment.getPsychologist().getId(), psychologist.getId(), "confirmar");

        if (!"PENDING".equals(request.getStatus())) {
            throw new IllegalArgumentException("Esta solicitud ya fue procesada");
        }

        appointmentRequestRepository.findByAppointment_Id(appointment.getId()).forEach(req -> {
            req.setStatus(req.getId().equals(requestId) ? "CONFIRMED" : "REJECTED");
            appointmentRequestRepository.save(req);
        });

        Instant now = Instant.now();
        appointment.setStatus("CONFIRMED");
        appointment.setUser(request.getUser());
        appointment.setConfirmedAt(now);
        appointment.setConfirmedByUser(request.getUser());
        appointment.setPaymentDeadline(null);
        appointment.setPaymentStatus("PAID");
        appointmentRepository.save(appointment);

        try {
            emailService.sendAppointmentConfirmationEmail(
                    request.getUser().getEmail(), request.getUser().getName(), psychologist.getName(),
                    appointment.getStartTime(), appointment.getPaymentDeadline(), appointment.getPrice());
        } catch (Exception e) {
            logger.error("Error enviando email de confirmación", e);
        }
    }

    @Transactional
    public void cancelAppointment(UserEntity psychologist, Long appointmentId) {
        requirePsychologist(psychologist);
        var appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));

        requireOwnership(appointment.getPsychologist().getId(), psychologist.getId(), "cancelar");

        if ("CANCELLED".equals(appointment.getStatus())) {
            throw new IllegalArgumentException("Esta cita ya está cancelada");
        }

        appointmentRequestRepository.findByAppointment_IdAndStatus(appointmentId, "PENDING")
                .forEach(req -> {
                    req.setStatus("REJECTED");
                    appointmentRequestRepository.save(req);
                });
        appointment.setStatus("CANCELLED");
        appointmentRepository.save(appointment);
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

        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setPsychologist(psychologist);
        appointment.setUser(user);
        appointment.setStartTime(req.start);
        appointment.setEndTime(req.end);
        appointment.setStatus("CONFIRMED");
        appointment.setPrice(req.price);
        Instant now = Instant.now();
        appointment.setConfirmedAt(now);
        appointment.setConfirmedByUser(user);
        appointment.setPaymentDeadline(null);
        appointment.setPaymentStatus("PAID");

        var saved = appointmentRepository.save(appointment);

        try {
            emailService.sendAppointmentConfirmationEmail(
                    user.getEmail(), user.getName(), psychologist.getName(),
                    appointment.getStartTime(), null, appointment.getPrice());
        } catch (Exception e) {
            logger.error("Error enviando email de confirmación", e);
        }

        return new CalendarDtos.CreateForPatientResponse(
                saved.getId(), saved.getStartTime().toString(), saved.getEndTime().toString(),
                saved.getStatus(), user.getId(), psychologist.getId()
        );
    }

    @Transactional(readOnly = true)
    public List<CalendarDtos.PastAppointmentDto> getPastAppointments(UserEntity user) {
        Instant now = Instant.now();
        return appointmentRepository.findByUser_IdOrderByStartTimeAsc(user.getId())
                .stream()
                .filter(apt -> ("CONFIRMED".equals(apt.getStatus()) || "BOOKED".equals(apt.getStatus())) && apt.getEndTime().isBefore(now))
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
    public List<CalendarDtos.PsychologistPastAppointmentDto> getPsychologistPastAppointments(UserEntity psychologist) {
        requirePsychologist(psychologist);
        Instant now = Instant.now();
        return appointmentRepository.findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(
                        psychologist.getId(), Instant.ofEpochMilli(0), now)
                .stream()
                .filter(apt -> ("CONFIRMED".equals(apt.getStatus()) || "BOOKED".equals(apt.getStatus()))
                        && apt.getEndTime().isBefore(now) && apt.getUser() != null)
                .map(this::toPsychologistPastAppointmentDto)
                .collect(Collectors.toList());
    }

    // --- Helpers ---

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
                .anyMatch(apt -> !"CANCELLED".equals(apt.getStatus())
                        && start.isBefore(apt.getEndTime()) && end.isAfter(apt.getStartTime()));
        if (overlap) throw new IllegalArgumentException("Ya existe una cita en este horario");
    }

    private void validatePrice(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El precio debe ser mayor a 0");
        }
    }

    private boolean isTodayOrFuture(Instant instant, Instant now) {
        return instant.isAfter(now) || instant.atZone(ZoneId.systemDefault()).toLocalDate()
                .equals(now.atZone(ZoneId.systemDefault()).toLocalDate());
    }

    private boolean isVisibleToUser(AppointmentEntity s, UserEntity user) {
        if ("FREE".equals(s.getStatus()) || "REQUESTED".equals(s.getStatus())) return true;
        if (("CONFIRMED".equals(s.getStatus()) || "BOOKED".equals(s.getStatus()))
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
                apt.getStatus(), apt.getPrice(),
                apt.getPaymentStatus(),
                apt.getPaymentDeadline() != null ? apt.getPaymentDeadline().toString() : null,
                apt.getConfirmedAt() != null ? apt.getConfirmedAt().toString() : null,
                null, psych);
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
                "REQUESTED", apt.getPrice(),
                null, null, null, req.getRequestedAt().toString(), psych);
    }

    private CalendarDtos.PendingRequestDto toPendingRequestDto(AppointmentRequestEntity req) {
        var user = new CalendarDtos.PendingUserDto(req.getUser().getId(), req.getUser().getName(), req.getUser().getEmail());
        var apt = req.getAppointment();
        var appointment = new CalendarDtos.PendingAppointmentDto(apt.getId(),
                apt.getStartTime().toString(), apt.getEndTime().toString(), apt.getPrice());
        return new CalendarDtos.PendingRequestDto(req.getId(), apt.getId(), req.getRequestedAt().toString(),
                req.getStatus(), user, appointment);
    }

    private CalendarDtos.PastAppointmentDto toPastAppointmentDto(AppointmentEntity apt, Long userId) {
        var psych = new CalendarDtos.PsychologistSummary(apt.getPsychologist().getId(), apt.getPsychologist().getName(), apt.getPsychologist().getEmail());
        var rating = appointmentRatingRepository.findByAppointment_IdAndUser_Id(apt.getId(), userId)
                .map(r -> new CalendarDtos.RatingDto(r.getId(), r.getRating(), r.getComment() != null ? r.getComment() : "", r.getCreatedAt() != null ? r.getCreatedAt().toString() : null))
                .orElse(null);
        return new CalendarDtos.PastAppointmentDto(apt.getId(), apt.getStartTime(), apt.getEndTime(), apt.getStatus(), apt.getPrice(), psych, rating);
    }

    private CalendarDtos.PsychologistPastAppointmentDto toPsychologistPastAppointmentDto(AppointmentEntity apt) {
        var user = new CalendarDtos.PastUserDto(apt.getUser().getId(), apt.getUser().getName(), apt.getUser().getEmail());
        var rating = appointmentRatingRepository.findByAppointment_IdAndUser_Id(apt.getId(), apt.getUser().getId())
                .map(r -> new CalendarDtos.RatingDto(r.getId(), r.getRating(), r.getComment() != null ? r.getComment() : "", r.getCreatedAt() != null ? r.getCreatedAt().toString() : null))
                .orElse(null);
        return new CalendarDtos.PsychologistPastAppointmentDto(apt.getId(), apt.getStartTime(), apt.getEndTime(), apt.getStatus(), apt.getPrice(), user, rating);
    }
}
