package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.AppointmentEntity;
import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.domain.UserPsychologistEntity;
import com.alvaro.psicoapp.dto.AdminDtos;
import com.alvaro.psicoapp.repository.AppointmentRepository;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminPsychologistService {

    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;
    private final AppointmentRepository appointmentRepository;
    private final CalendarService calendarService;

    public AdminPsychologistService(UserRepository userRepository,
                                    UserPsychologistRepository userPsychologistRepository,
                                    AppointmentRepository appointmentRepository,
                                    CalendarService calendarService) {
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.appointmentRepository = appointmentRepository;
        this.calendarService = calendarService;
    }

    @Transactional(readOnly = true)
    public AdminDtos.PsychologistAdminSummaryDto getPsychologistSummary(Long psychologistId) {
        UserEntity psych = userRepository.findById(psychologistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Psicólogo no encontrado"));
        if (!RoleConstants.PSYCHOLOGIST.equals(psych.getRole())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Psicólogo no encontrado");
        }

        var rating = calendarService.getPsychologistRating(psychologistId);
        Double avgRating = rating != null ? rating.averageRating() : null;
        long totalRatings = rating != null ? rating.totalRatings() : 0;

        var rels = userPsychologistRepository.findByPsychologist_Id(psychologistId);
        List<AdminDtos.PsychologistAdminPatientDto> activePatients = new ArrayList<>();
        List<AdminDtos.PsychologistAdminPatientDto> dischargedPatients = new ArrayList<>();
        for (UserPsychologistEntity r : rels) {
            var dto = new AdminDtos.PsychologistAdminPatientDto(
                    r.getUser().getId(),
                    r.getUser().getName(),
                    r.getUser().getEmail(),
                    r.getStatus() != null ? r.getStatus() : "ACTIVE",
                    r.getAssignedAt() != null ? r.getAssignedAt().toString() : null
            );
            if ("DISCHARGED".equals(r.getStatus())) {
                dischargedPatients.add(dto);
            } else {
                activePatients.add(dto);
            }
        }

        Instant now = Instant.now();
        Instant yearFromNow = now.plus(365, ChronoUnit.DAYS);
        var allFuture = appointmentRepository.findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(
                psychologistId, now, yearFromNow);
        List<AdminDtos.PsychologistAdminAppointmentDto> scheduledAppointments = allFuture.stream()
                .filter(a -> ("BOOKED".equals(a.getStatus()) || "CONFIRMED".equals(a.getStatus())) && a.getUser() != null)
                .map(this::toAppointmentDto)
                .collect(Collectors.toList());

        Instant yearAgo = now.minus(365, ChronoUnit.DAYS);
        var allPast = appointmentRepository.findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(
                psychologistId, yearAgo, now);
        BigDecimal totalBilled = BigDecimal.ZERO;
        List<AdminDtos.PsychologistAdminAppointmentDto> pastAppointments = new ArrayList<>();
        for (AppointmentEntity a : allPast) {
            if (("BOOKED".equals(a.getStatus()) || "CONFIRMED".equals(a.getStatus()))
                    && a.getEndTime().isBefore(now) && a.getUser() != null) {
                pastAppointments.add(toAppointmentDto(a));
                if (a.getPrice() != null) {
                    totalBilled = totalBilled.add(a.getPrice());
                }
            }
        }
        Collections.reverse(pastAppointments);

        return new AdminDtos.PsychologistAdminSummaryDto(
                psych.getId(),
                psych.getName(),
                psych.getEmail(),
                psych.getCreatedAt() != null ? psych.getCreatedAt().toString() : null,
                avgRating,
                totalRatings,
                activePatients,
                dischargedPatients,
                scheduledAppointments,
                pastAppointments,
                totalBilled
        );
    }

    private AdminDtos.PsychologistAdminAppointmentDto toAppointmentDto(AppointmentEntity a) {
        String patientName = a.getUser() != null ? a.getUser().getName() : null;
        String patientEmail = a.getUser() != null ? a.getUser().getEmail() : null;
        return new AdminDtos.PsychologistAdminAppointmentDto(
                a.getId(),
                a.getStartTime() != null ? a.getStartTime().toString() : null,
                a.getEndTime() != null ? a.getEndTime().toString() : null,
                a.getStatus(),
                a.getPrice(),
                patientName,
                patientEmail
        );
    }
}
