package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.AppointmentEntity;
import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.domain.UserPsychologistEntity;
import com.alvaro.psicoapp.dto.JitsiDtos;
import com.alvaro.psicoapp.repository.AppointmentRepository;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JitsiServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserPsychologistRepository userPsychologistRepository;

    private JitsiService jitsiService;

    private UserEntity patientUser;
    private UserEntity psychologistUser;

    @BeforeEach
    void setUp() {
        jitsiService = new JitsiService(appointmentRepository, userRepository, userPsychologistRepository);

        patientUser = new UserEntity();
        patientUser.setId(1L);
        patientUser.setName("Patient");
        patientUser.setEmail("patient@example.com");
        patientUser.setRole(RoleConstants.USER);

        psychologistUser = new UserEntity();
        psychologistUser.setId(2L);
        psychologistUser.setName("Dr. Psychologist");
        psychologistUser.setEmail("psych@example.com");
        psychologistUser.setRole(RoleConstants.PSYCHOLOGIST);
    }

    // ── Valid appointment returns room info ──────────────────────────────

    @Test
    @DisplayName("getRoomInfo - patient calling psychologist with valid appointment returns room info")
    void getRoomInfo_validAppointment_patientCallsPsych_returnsRoomInfo() {
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(userRepository.findByEmail("psych@example.com")).thenReturn(Optional.of(psychologistUser));

        UserPsychologistEntity relation = new UserPsychologistEntity();
        relation.setUser(patientUser);
        relation.setPsychologist(psychologistUser);
        when(userPsychologistRepository.findByUserId(1L)).thenReturn(Optional.of(relation));

        // Appointment starting 30 minutes ago, ending in 30 minutes (within the 1-hour window)
        Instant now = Instant.now();
        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setId(100L);
        appointment.setStartTime(now.minus(30, ChronoUnit.MINUTES));
        appointment.setEndTime(now.plus(30, ChronoUnit.MINUTES));
        appointment.setStatus("BOOKED");
        appointment.setPsychologist(psychologistUser);
        appointment.setUser(patientUser);

        when(appointmentRepository.findByPsychologist_IdAndUser_IdAndStartTimeGreaterThanEqualAndStatusIn(
                eq(2L), eq(1L), any(Instant.class)))
                .thenReturn(List.of(appointment));

        JitsiDtos.RoomInfoResponse result = jitsiService.getRoomInfo("patient@example.com", "psych@example.com");

        assertNotNull(result);
        assertEquals("gantly-100", result.roomName());
        assertTrue(result.hasActiveAppointment());
        assertEquals("patient@example.com", result.currentUser().email());
        assertEquals("Patient", result.currentUser().name());
        assertEquals("psych@example.com", result.otherUser().email());
        assertEquals("Dr. Psychologist", result.otherUser().name());
    }

    @Test
    @DisplayName("getRoomInfo - psychologist calling patient with valid appointment returns room info")
    void getRoomInfo_validAppointment_psychCallsPatient_returnsRoomInfo() {
        when(userRepository.findByEmail("psych@example.com")).thenReturn(Optional.of(psychologistUser));
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));

        UserPsychologistEntity relation = new UserPsychologistEntity();
        relation.setUser(patientUser);
        relation.setPsychologist(psychologistUser);
        when(userPsychologistRepository.findByUserId(1L)).thenReturn(Optional.of(relation));

        Instant now = Instant.now();
        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setId(200L);
        appointment.setStartTime(now.minus(10, ChronoUnit.MINUTES));
        appointment.setEndTime(now.plus(50, ChronoUnit.MINUTES));
        appointment.setStatus("CONFIRMED");
        appointment.setPsychologist(psychologistUser);
        appointment.setUser(patientUser);

        when(appointmentRepository.findByPsychologist_IdAndUser_IdAndStartTimeGreaterThanEqualAndStatusIn(
                eq(2L), eq(1L), any(Instant.class)))
                .thenReturn(List.of(appointment));

        JitsiDtos.RoomInfoResponse result = jitsiService.getRoomInfo("psych@example.com", "patient@example.com");

        assertNotNull(result);
        assertEquals("gantly-200", result.roomName());
        assertTrue(result.hasActiveAppointment());
        assertEquals("psych@example.com", result.currentUser().email());
    }

    // ── No appointment throws forbidden ─────────────────────────────────

    @Test
    @DisplayName("getRoomInfo - no valid relation throws 403 Forbidden")
    void getRoomInfo_noRelation_throwsForbidden() {
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(userRepository.findByEmail("psych@example.com")).thenReturn(Optional.of(psychologistUser));
        when(userPsychologistRepository.findByUserId(1L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> jitsiService.getRoomInfo("patient@example.com", "psych@example.com"));

        assertEquals(403, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("No tienes una cita activa"));
    }

    @Test
    @DisplayName("getRoomInfo - valid relation but no appointments throws 403 Forbidden")
    void getRoomInfo_noAppointments_throwsForbidden() {
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(userRepository.findByEmail("psych@example.com")).thenReturn(Optional.of(psychologistUser));

        UserPsychologistEntity relation = new UserPsychologistEntity();
        relation.setUser(patientUser);
        relation.setPsychologist(psychologistUser);
        when(userPsychologistRepository.findByUserId(1L)).thenReturn(Optional.of(relation));

        when(appointmentRepository.findByPsychologist_IdAndUser_IdAndStartTimeGreaterThanEqualAndStatusIn(
                eq(2L), eq(1L), any(Instant.class)))
                .thenReturn(Collections.emptyList());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> jitsiService.getRoomInfo("patient@example.com", "psych@example.com"));

        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    @DisplayName("getRoomInfo - user not found throws 404")
    void getRoomInfo_userNotFound_throwsNotFound() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> jitsiService.getRoomInfo("unknown@example.com", "psych@example.com"));

        assertEquals(404, ex.getStatusCode().value());
    }

    @Test
    @DisplayName("getRoomInfo - other user not found throws 404")
    void getRoomInfo_otherUserNotFound_throwsNotFound() {
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> jitsiService.getRoomInfo("patient@example.com", "unknown@example.com"));

        assertEquals(404, ex.getStatusCode().value());
    }

    // ── Time window validation ──────────────────────────────────────────

    @Test
    @DisplayName("getRoomInfo - appointment too far in the future throws 403 with time message")
    void getRoomInfo_appointmentTooFarInFuture_throwsForbiddenWithTimeMessage() {
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(userRepository.findByEmail("psych@example.com")).thenReturn(Optional.of(psychologistUser));

        UserPsychologistEntity relation = new UserPsychologistEntity();
        relation.setUser(patientUser);
        relation.setPsychologist(psychologistUser);
        when(userPsychologistRepository.findByUserId(1L)).thenReturn(Optional.of(relation));

        // Appointment starts in 3 hours - well outside the 1-hour-before window
        Instant now = Instant.now();
        AppointmentEntity futureAppointment = new AppointmentEntity();
        futureAppointment.setId(300L);
        futureAppointment.setStartTime(now.plus(3, ChronoUnit.HOURS));
        futureAppointment.setEndTime(now.plus(4, ChronoUnit.HOURS));
        futureAppointment.setStatus("BOOKED");
        futureAppointment.setPsychologist(psychologistUser);
        futureAppointment.setUser(patientUser);

        when(appointmentRepository.findByPsychologist_IdAndUser_IdAndStartTimeGreaterThanEqualAndStatusIn(
                eq(2L), eq(1L), any(Instant.class)))
                .thenReturn(List.of(futureAppointment));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> jitsiService.getRoomInfo("patient@example.com", "psych@example.com"));

        assertEquals(403, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("minutos"));
    }

    @Test
    @DisplayName("getRoomInfo - appointment within 1 hour before window is valid")
    void getRoomInfo_appointmentWithin1HourBefore_isValid() {
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(userRepository.findByEmail("psych@example.com")).thenReturn(Optional.of(psychologistUser));

        UserPsychologistEntity relation = new UserPsychologistEntity();
        relation.setUser(patientUser);
        relation.setPsychologist(psychologistUser);
        when(userPsychologistRepository.findByUserId(1L)).thenReturn(Optional.of(relation));

        // Appointment starts in 45 minutes - within the 1-hour-before window
        Instant now = Instant.now();
        AppointmentEntity soonAppointment = new AppointmentEntity();
        soonAppointment.setId(400L);
        soonAppointment.setStartTime(now.plus(45, ChronoUnit.MINUTES));
        soonAppointment.setEndTime(now.plus(105, ChronoUnit.MINUTES));
        soonAppointment.setStatus("BOOKED");
        soonAppointment.setPsychologist(psychologistUser);
        soonAppointment.setUser(patientUser);

        when(appointmentRepository.findByPsychologist_IdAndUser_IdAndStartTimeGreaterThanEqualAndStatusIn(
                eq(2L), eq(1L), any(Instant.class)))
                .thenReturn(List.of(soonAppointment));

        JitsiDtos.RoomInfoResponse result = jitsiService.getRoomInfo("patient@example.com", "psych@example.com");

        assertNotNull(result);
        assertEquals("gantly-400", result.roomName());
        assertTrue(result.hasActiveAppointment());
    }

    @Test
    @DisplayName("getRoomInfo - appointment ended but within 1 hour after window is valid")
    void getRoomInfo_appointmentEndedButWithin1HourAfter_isValid() {
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(userRepository.findByEmail("psych@example.com")).thenReturn(Optional.of(psychologistUser));

        UserPsychologistEntity relation = new UserPsychologistEntity();
        relation.setUser(patientUser);
        relation.setPsychologist(psychologistUser);
        when(userPsychologistRepository.findByUserId(1L)).thenReturn(Optional.of(relation));

        // Appointment ended 30 minutes ago - within the 1-hour-after window
        Instant now = Instant.now();
        AppointmentEntity recentAppointment = new AppointmentEntity();
        recentAppointment.setId(500L);
        recentAppointment.setStartTime(now.minus(90, ChronoUnit.MINUTES));
        recentAppointment.setEndTime(now.minus(30, ChronoUnit.MINUTES));
        recentAppointment.setStatus("CONFIRMED");
        recentAppointment.setPsychologist(psychologistUser);
        recentAppointment.setUser(patientUser);

        when(appointmentRepository.findByPsychologist_IdAndUser_IdAndStartTimeGreaterThanEqualAndStatusIn(
                eq(2L), eq(1L), any(Instant.class)))
                .thenReturn(List.of(recentAppointment));

        JitsiDtos.RoomInfoResponse result = jitsiService.getRoomInfo("patient@example.com", "psych@example.com");

        assertNotNull(result);
        assertEquals("gantly-500", result.roomName());
        assertTrue(result.hasActiveAppointment());
    }
}
