package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.AppointmentEntity;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CalendarServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private AppointmentRequestRepository appointmentRequestRepository;

    @Mock
    private AppointmentRatingRepository appointmentRatingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserPsychologistRepository userPsychologistRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private NotificationService notificationService;

    private CalendarService calendarService;

    private UserEntity psychologist;
    private UserEntity patient;

    @BeforeEach
    void setUp() {
        calendarService = new CalendarService(
                appointmentRepository,
                appointmentRequestRepository,
                appointmentRatingRepository,
                userRepository,
                userPsychologistRepository,
                emailService,
                notificationService
        );

        psychologist = new UserEntity();
        psychologist.setId(1L);
        psychologist.setName("Dr. Garcia");
        psychologist.setEmail("garcia@example.com");
        psychologist.setRole(RoleConstants.PSYCHOLOGIST);

        patient = new UserEntity();
        patient.setId(2L);
        patient.setName("Patient User");
        patient.setEmail("patient@example.com");
        patient.setRole(RoleConstants.USER);
    }

    // ── createSlot ──────────────────────────────────────────────────────

    @Test
    @DisplayName("createSlot - successful creation sets status FREE and saves")
    void createSlot_success_setsStatusFreeAndSaves() {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end = start.plus(60, ChronoUnit.MINUTES);

        CalendarDtos.CreateSlotRequest req = new CalendarDtos.CreateSlotRequest();
        req.start = start;
        req.end = end;
        req.price = new BigDecimal("50.00");

        when(appointmentRepository.findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(
                eq(1L), any(Instant.class), any(Instant.class)))
                .thenReturn(Collections.emptyList());
        when(appointmentRepository.save(any(AppointmentEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AppointmentEntity result = calendarService.createSlot(psychologist, req);

        assertNotNull(result);
        assertEquals(psychologist, result.getPsychologist());
        assertEquals(start, result.getStartTime());
        assertEquals(end, result.getEndTime());
        assertEquals(AppointmentStatus.FREE, result.getStatus());
        assertEquals(new BigDecimal("50.00"), result.getPrice());

        verify(appointmentRepository).save(any(AppointmentEntity.class));
    }

    @Test
    @DisplayName("createSlot - past start time throws IllegalArgumentException")
    void createSlot_pastTime_throwsException() {
        Instant start = Instant.now().minus(1, ChronoUnit.HOURS);
        Instant end = start.plus(60, ChronoUnit.MINUTES);

        CalendarDtos.CreateSlotRequest req = new CalendarDtos.CreateSlotRequest();
        req.start = start;
        req.end = end;
        req.price = new BigDecimal("50.00");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> calendarService.createSlot(psychologist, req));

        assertEquals("No se pueden crear citas en el pasado", ex.getMessage());
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("createSlot - duration less than 30 minutes throws IllegalArgumentException")
    void createSlot_shortDuration_throwsException() {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end = start.plus(15, ChronoUnit.MINUTES);

        CalendarDtos.CreateSlotRequest req = new CalendarDtos.CreateSlotRequest();
        req.start = start;
        req.end = end;
        req.price = new BigDecimal("50.00");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> calendarService.createSlot(psychologist, req));

        assertEquals("La duración mínima de una cita es de 30 minutos", ex.getMessage());
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("createSlot - overlapping slot throws IllegalArgumentException")
    void createSlot_overlappingSlot_throwsException() {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end = start.plus(60, ChronoUnit.MINUTES);

        AppointmentEntity existingSlot = new AppointmentEntity();
        existingSlot.setId(99L);
        existingSlot.setStartTime(start.minus(30, ChronoUnit.MINUTES));
        existingSlot.setEndTime(start.plus(30, ChronoUnit.MINUTES));
        existingSlot.setStatus(AppointmentStatus.FREE);

        CalendarDtos.CreateSlotRequest req = new CalendarDtos.CreateSlotRequest();
        req.start = start;
        req.end = end;
        req.price = new BigDecimal("50.00");

        when(appointmentRepository.findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(
                eq(1L), any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(existingSlot));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> calendarService.createSlot(psychologist, req));

        assertEquals("Ya existe una cita en este horario", ex.getMessage());
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("createSlot - non-psychologist user throws ResponseStatusException FORBIDDEN")
    void createSlot_nonPsychologist_throwsForbidden() {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end = start.plus(60, ChronoUnit.MINUTES);

        CalendarDtos.CreateSlotRequest req = new CalendarDtos.CreateSlotRequest();
        req.start = start;
        req.end = end;
        req.price = new BigDecimal("50.00");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> calendarService.createSlot(patient, req));

        assertEquals(403, ex.getStatusCode().value());
        verify(appointmentRepository, never()).save(any());
    }

    // ── bookAppointment ─────────────────────────────────────────────────

    @Test
    @DisplayName("bookAppointment - successful booking creates request and updates status to REQUESTED")
    void bookAppointment_success_createsRequestAndUpdatesStatus() {
        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setId(10L);
        appointment.setPsychologist(psychologist);
        appointment.setStatus(AppointmentStatus.FREE);

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));
        when(appointmentRequestRepository.findByAppointment_IdAndUser_Id(10L, 2L))
                .thenReturn(Optional.empty());

        calendarService.bookAppointment(patient, 10L);

        ArgumentCaptor<AppointmentRequestEntity> requestCaptor =
                ArgumentCaptor.forClass(AppointmentRequestEntity.class);
        verify(appointmentRequestRepository).save(requestCaptor.capture());

        AppointmentRequestEntity savedRequest = requestCaptor.getValue();
        assertEquals(appointment, savedRequest.getAppointment());
        assertEquals(patient, savedRequest.getUser());
        assertEquals(AppointmentStatus.REQUEST_PENDING, savedRequest.getStatus());

        assertEquals(AppointmentStatus.REQUESTED, appointment.getStatus());
        verify(appointmentRepository).save(appointment);

        verify(notificationService).createNotification(eq(1L), eq("APPOINTMENT"),
                eq("Nueva solicitud de cita"), contains("Patient User"));
    }

    @Test
    @DisplayName("bookAppointment - already booked slot throws IllegalArgumentException")
    void bookAppointment_alreadyBooked_throwsException() {
        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setId(10L);
        appointment.setPsychologist(psychologist);
        appointment.setStatus(AppointmentStatus.CONFIRMED);

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> calendarService.bookAppointment(patient, 10L));

        assertEquals("Esta cita ya no está disponible", ex.getMessage());
        verify(appointmentRequestRepository, never()).save(any());
    }

    @Test
    @DisplayName("bookAppointment - duplicate request throws IllegalArgumentException")
    void bookAppointment_duplicateRequest_throwsException() {
        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setId(10L);
        appointment.setPsychologist(psychologist);
        appointment.setStatus(AppointmentStatus.FREE);

        AppointmentRequestEntity existingRequest = new AppointmentRequestEntity();
        existingRequest.setId(5L);

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));
        when(appointmentRequestRepository.findByAppointment_IdAndUser_Id(10L, 2L))
                .thenReturn(Optional.of(existingRequest));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> calendarService.bookAppointment(patient, 10L));

        assertEquals("Ya has solicitado esta cita", ex.getMessage());
        verify(appointmentRequestRepository, never()).save(any());
    }

    // ── confirmAppointment ──────────────────────────────────────────────

    @Test
    @DisplayName("confirmAppointment - successful confirmation rejects others, sends email, creates notification, sets payment")
    void confirmAppointment_success_fullFlow() {
        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setId(10L);
        appointment.setPsychologist(psychologist);
        appointment.setStartTime(Instant.now().plus(1, ChronoUnit.DAYS));
        appointment.setEndTime(Instant.now().plus(1, ChronoUnit.DAYS).plus(60, ChronoUnit.MINUTES));
        appointment.setPrice(new BigDecimal("75.00"));

        AppointmentRequestEntity confirmedRequest = new AppointmentRequestEntity();
        confirmedRequest.setId(20L);
        confirmedRequest.setAppointment(appointment);
        confirmedRequest.setUser(patient);
        confirmedRequest.setStatus(AppointmentStatus.REQUEST_PENDING);

        UserEntity otherPatient = new UserEntity();
        otherPatient.setId(3L);
        otherPatient.setName("Other Patient");
        otherPatient.setEmail("other@example.com");
        otherPatient.setRole(RoleConstants.USER);

        AppointmentRequestEntity rejectedRequest = new AppointmentRequestEntity();
        rejectedRequest.setId(21L);
        rejectedRequest.setAppointment(appointment);
        rejectedRequest.setUser(otherPatient);
        rejectedRequest.setStatus(AppointmentStatus.REQUEST_PENDING);

        when(appointmentRequestRepository.findById(20L)).thenReturn(Optional.of(confirmedRequest));
        when(appointmentRequestRepository.findByAppointment_Id(10L))
                .thenReturn(List.of(confirmedRequest, rejectedRequest));

        calendarService.confirmAppointment(psychologist, 20L);

        // Verified confirmed request is set to CONFIRMED
        assertEquals(AppointmentStatus.REQUEST_CONFIRMED, confirmedRequest.getStatus());

        // Verified rejected request is set to REJECTED
        assertEquals(AppointmentStatus.REQUEST_REJECTED, rejectedRequest.getStatus());

        // Verified appointment is set to CONFIRMED with payment fields
        assertEquals(AppointmentStatus.CONFIRMED, appointment.getStatus());
        assertEquals(patient, appointment.getUser());
        assertNotNull(appointment.getConfirmedAt());
        assertEquals(patient, appointment.getConfirmedByUser());
        assertEquals("PENDING", appointment.getPaymentStatus());
        assertNotNull(appointment.getPaymentDeadline());
        // Payment deadline should be ~48 hours from confirmation
        assertTrue(appointment.getPaymentDeadline().isAfter(Instant.now().plusSeconds(47 * 60 * 60)));
        assertTrue(appointment.getPaymentDeadline().isBefore(Instant.now().plusSeconds(49 * 60 * 60)));

        verify(appointmentRepository).save(appointment);

        // Verify email was sent to the confirmed patient
        verify(emailService).sendAppointmentConfirmationEmail(
                eq("patient@example.com"), eq("Patient User"), eq("Dr. Garcia"),
                eq(appointment.getStartTime()), eq(appointment.getPaymentDeadline()),
                eq(appointment.getPrice()));

        // Verify notification sent to the rejected patient
        verify(notificationService).createNotification(eq(3L), eq("APPOINTMENT"),
                eq("Solicitud rechazada"), contains("Dr. Garcia"));

        // Verify notification sent to the confirmed patient
        verify(notificationService).createNotification(eq(2L), eq("APPOINTMENT"),
                eq("Cita confirmada"), contains("Dr. Garcia"));
    }

    // ── cancelAppointment ───────────────────────────────────────────────

    @Test
    @DisplayName("cancelAppointment - successful cancellation sets status and notifies patient")
    void cancelAppointment_success_cancelsAndNotifiesPatient() {
        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setId(10L);
        appointment.setPsychologist(psychologist);
        appointment.setUser(patient);
        appointment.setStatus(AppointmentStatus.CONFIRMED);

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));
        lenient().when(appointmentRequestRepository.findByAppointment_IdAndStatus(10L, "PENDING"))
                .thenReturn(Collections.emptyList());

        calendarService.cancelAppointment(psychologist, 10L);

        assertEquals(AppointmentStatus.CANCELLED, appointment.getStatus());
        verify(appointmentRepository).save(appointment);

        // Verify notification sent to patient
        verify(notificationService).createNotification(eq(2L), eq("APPOINTMENT"),
                eq("Cita cancelada"), contains("Dr. Garcia"));
    }

    @Test
    @DisplayName("cancelAppointment - already cancelled throws IllegalArgumentException")
    void cancelAppointment_alreadyCancelled_throwsException() {
        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setId(10L);
        appointment.setPsychologist(psychologist);
        appointment.setStatus(AppointmentStatus.CANCELLED);

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> calendarService.cancelAppointment(psychologist, 10L));

        assertEquals("Esta cita ya está cancelada", ex.getMessage());
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("cancelAppointment - appointment without patient does not send notification")
    void cancelAppointment_noPatient_noNotification() {
        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setId(10L);
        appointment.setPsychologist(psychologist);
        appointment.setUser(null);
        appointment.setStatus(AppointmentStatus.FREE);

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));
        lenient().when(appointmentRequestRepository.findByAppointment_IdAndStatus(10L, "PENDING"))
                .thenReturn(Collections.emptyList());

        calendarService.cancelAppointment(psychologist, 10L);

        assertEquals(AppointmentStatus.CANCELLED, appointment.getStatus());
        verify(appointmentRepository).save(appointment);
        verify(notificationService, never()).createNotification(anyLong(), anyString(), anyString(), anyString());
    }

    // ── deleteSlot ──────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteSlot - successful deletion of FREE slot")
    void deleteSlot_freeSlot_deletesSuccessfully() {
        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setId(10L);
        appointment.setPsychologist(psychologist);
        appointment.setStatus(AppointmentStatus.FREE);

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));
        when(appointmentRequestRepository.findByAppointment_IdAndStatus(10L, AppointmentStatus.REQUEST_PENDING))
                .thenReturn(Collections.emptyList());

        calendarService.deleteSlot(psychologist, 10L);

        verify(appointmentRepository).delete(appointment);
    }

    @Test
    @DisplayName("deleteSlot - cannot delete confirmed slot throws IllegalArgumentException")
    void deleteSlot_confirmedSlot_throwsException() {
        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setId(10L);
        appointment.setPsychologist(psychologist);
        appointment.setStatus(AppointmentStatus.CONFIRMED);

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> calendarService.deleteSlot(psychologist, 10L));

        assertEquals("No puedes eliminar citas confirmadas o reservadas. Usa la opción de cancelar en su lugar.",
                ex.getMessage());
        verify(appointmentRepository, never()).delete(any());
    }

    @Test
    @DisplayName("deleteSlot - cannot delete booked slot throws IllegalArgumentException")
    void deleteSlot_bookedSlot_throwsException() {
        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setId(10L);
        appointment.setPsychologist(psychologist);
        appointment.setStatus(AppointmentStatus.BOOKED);

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> calendarService.deleteSlot(psychologist, 10L));

        assertEquals("No puedes eliminar citas confirmadas o reservadas. Usa la opción de cancelar en su lugar.",
                ex.getMessage());
        verify(appointmentRepository, never()).delete(any());
    }

    @Test
    @DisplayName("deleteSlot - deleting slot with pending requests rejects them and notifies users")
    void deleteSlot_withPendingRequests_rejectsAndNotifies() {
        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setId(10L);
        appointment.setPsychologist(psychologist);
        appointment.setStatus(AppointmentStatus.REQUESTED);

        AppointmentRequestEntity pendingRequest = new AppointmentRequestEntity();
        pendingRequest.setId(30L);
        pendingRequest.setAppointment(appointment);
        pendingRequest.setUser(patient);
        pendingRequest.setStatus(AppointmentStatus.REQUEST_PENDING);

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));
        when(appointmentRequestRepository.findByAppointment_IdAndStatus(10L, AppointmentStatus.REQUEST_PENDING))
                .thenReturn(List.of(pendingRequest));

        calendarService.deleteSlot(psychologist, 10L);

        // Verify pending request was rejected
        assertEquals(AppointmentStatus.REQUEST_REJECTED, pendingRequest.getStatus());
        verify(appointmentRequestRepository).save(pendingRequest);

        // Verify notification sent to the requesting user
        verify(notificationService).createNotification(eq(2L), eq("APPOINTMENT"),
                eq("Horario eliminado"), contains("Dr. Garcia"));

        // Verify the appointment itself was deleted
        verify(appointmentRepository).delete(appointment);
    }
}
