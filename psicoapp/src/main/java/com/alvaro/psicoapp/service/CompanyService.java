package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.AppointmentEntity;
import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.domain.UserPsychologistEntity;
import com.alvaro.psicoapp.repository.AppointmentRepository;
import com.alvaro.psicoapp.repository.CompanyRepository;
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
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CompanyService {

    public record CompanyMeDto(String name, String email, String referralCode) {}

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;
    private final AppointmentRepository appointmentRepository;
    private final CalendarService calendarService;

    public CompanyService(CompanyRepository companyRepository, UserRepository userRepository,
                          UserPsychologistRepository userPsychologistRepository,
                          AppointmentRepository appointmentRepository, CalendarService calendarService) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.appointmentRepository = appointmentRepository;
        this.calendarService = calendarService;
    }

    @Transactional(readOnly = true)
    public CompanyMeDto getMe(String companyEmail) {
        var company = companyRepository.findByEmail(companyEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empresa no encontrada"));
        return new CompanyMeDto(company.getName(), company.getEmail(), company.getReferralCode());
    }

    @Transactional(readOnly = true)
    public List<CompanyPsychologistSummaryDto> getPsychologists(String companyEmail) {
        var company = companyRepository.findByEmail(companyEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empresa no encontrada"));

        List<UserEntity> psychologists = userRepository.findByCompanyId(company.getId());
        List<CompanyPsychologistSummaryDto> result = new ArrayList<>();

        for (UserEntity psych : psychologists) {
            var rating = calendarService.getPsychologistRating(psych.getId());
            Double avgRating = rating != null ? rating.averageRating() : null;
            long totalRatings = rating != null ? rating.totalRatings() : 0;

            int activePatients = 0;
            var rels = userPsychologistRepository.findByPsychologist_Id(psych.getId());
            for (UserPsychologistEntity r : rels) {
                if (!"DISCHARGED".equals(r.getStatus())) activePatients++;
            }

            Instant now = Instant.now();
            long upcomingAppointments = 0;
            var future = appointmentRepository.findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(
                    psych.getId(), now, now.plus(365, ChronoUnit.DAYS));
            for (AppointmentEntity a : future) {
                if (("BOOKED".equals(a.getStatus()) || "CONFIRMED".equals(a.getStatus())) && a.getUser() != null)
                    upcomingAppointments++;
            }

            result.add(new CompanyPsychologistSummaryDto(
                    psych.getId(),
                    psych.getName(),
                    psych.getEmail(),
                    psych.getReferralCode(),
                    avgRating,
                    totalRatings,
                    activePatients,
                    upcomingAppointments
            ));
        }

        return result;
    }

    @Transactional(readOnly = true)
    public CompanyPsychologistDetailDto getPsychologistDetail(String companyEmail, Long psychologistId) {
        var company = companyRepository.findByEmail(companyEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empresa no encontrada"));

        UserEntity psych = userRepository.findById(psychologistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Psicólogo no encontrado"));
        if (!RoleConstants.PSYCHOLOGIST.equals(psych.getRole())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Psicólogo no encontrado");
        }
        if (!company.getId().equals(psych.getCompanyId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este psicólogo no pertenece a tu empresa");
        }

        var rating = calendarService.getPsychologistRating(psychologistId);
        Double avgRating = rating != null ? rating.averageRating() : null;
        long totalRatings = rating != null ? rating.totalRatings() : 0;

        List<CompanyPatientDto> activePatients = new ArrayList<>();
        List<CompanyPatientDto> dischargedPatients = new ArrayList<>();
        for (UserPsychologistEntity r : userPsychologistRepository.findByPsychologist_Id(psychologistId)) {
            var dto = new CompanyPatientDto(
                    r.getUser().getId(),
                    r.getUser().getName(),
                    r.getUser().getEmail(),
                    r.getStatus() != null ? r.getStatus() : "ACTIVE",
                    r.getAssignedAt() != null ? r.getAssignedAt().toString() : null
            );
            if ("DISCHARGED".equals(r.getStatus())) dischargedPatients.add(dto);
            else activePatients.add(dto);
        }

        Instant now = Instant.now();
        var future = appointmentRepository.findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(
                psychologistId, now, now.plus(365, ChronoUnit.DAYS));
        List<CompanyAppointmentDto> scheduled = future.stream()
                .filter(a -> ("BOOKED".equals(a.getStatus()) || "CONFIRMED".equals(a.getStatus())) && a.getUser() != null)
                .map(this::toAppointmentDto)
                .collect(Collectors.toList());

        var past = appointmentRepository.findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(
                psychologistId, now.minus(365, ChronoUnit.DAYS), now);
        List<CompanyAppointmentDto> pastAppointments = new ArrayList<>();
        BigDecimal totalBilled = BigDecimal.ZERO;
        for (AppointmentEntity a : past) {
            if (("BOOKED".equals(a.getStatus()) || "CONFIRMED".equals(a.getStatus()))
                    && a.getEndTime().isBefore(now) && a.getUser() != null) {
                pastAppointments.add(toAppointmentDto(a));
                if (a.getPrice() != null) totalBilled = totalBilled.add(a.getPrice());
            }
        }
        pastAppointments.sort(Comparator.comparing(CompanyAppointmentDto::startTime).reversed());

        return new CompanyPsychologistDetailDto(
                psych.getId(),
                psych.getName(),
                psych.getEmail(),
                psych.getReferralCode(),
                psych.getCreatedAt() != null ? psych.getCreatedAt().toString() : null,
                avgRating,
                totalRatings,
                activePatients,
                dischargedPatients,
                scheduled,
                pastAppointments,
                totalBilled
        );
    }

    private CompanyAppointmentDto toAppointmentDto(AppointmentEntity a) {
        String patientName = a.getUser() != null ? a.getUser().getName() : null;
        String patientEmail = a.getUser() != null ? a.getUser().getEmail() : null;
        return new CompanyAppointmentDto(
                a.getId(),
                a.getStartTime() != null ? a.getStartTime().toString() : null,
                a.getEndTime() != null ? a.getEndTime().toString() : null,
                a.getStatus(),
                a.getPrice(),
                patientName,
                patientEmail
        );
    }

    public record CompanyPsychologistSummaryDto(Long id, String name, String email, String referralCode,
                                                Double averageRating, long totalRatings,
                                                int activePatients, long upcomingAppointments) {}

    public record CompanyPsychologistDetailDto(Long id, String name, String email, String referralCode, String createdAt,
                                               Double averageRating, long totalRatings,
                                               List<CompanyPatientDto> activePatients,
                                               List<CompanyPatientDto> dischargedPatients,
                                               List<CompanyAppointmentDto> scheduledAppointments,
                                               List<CompanyAppointmentDto> pastAppointments,
                                               java.math.BigDecimal totalBilled) {}

    public record CompanyPatientDto(Long id, String name, String email, String status, String assignedAt) {}

    public record CompanyAppointmentDto(Long id, String startTime, String endTime, String status,
                                        java.math.BigDecimal price, String patientName, String patientEmail) {}
}
