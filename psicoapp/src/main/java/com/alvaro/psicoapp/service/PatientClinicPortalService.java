package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PatientClinicPortalService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final ClinicServiceRepository clinicServiceRepository;
    private final ClinicPatientDocumentRepository clinicPatientDocumentRepository;
    private final UserPsychologistRepository userPsychologistRepository;

    public PatientClinicPortalService(CompanyRepository companyRepository,
                                       UserRepository userRepository,
                                       AppointmentRepository appointmentRepository,
                                       ClinicServiceRepository clinicServiceRepository,
                                       ClinicPatientDocumentRepository clinicPatientDocumentRepository,
                                       UserPsychologistRepository userPsychologistRepository) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
        this.clinicServiceRepository = clinicServiceRepository;
        this.clinicPatientDocumentRepository = clinicPatientDocumentRepository;
        this.userPsychologistRepository = userPsychologistRepository;
    }

    // --- DTOs ---
    public record ClinicServiceSummaryDto(Long id, String name, BigDecimal defaultPrice, Integer durationMinutes) {}

    public record MyClinicDto(Long id, String name, String address, String phone, String website,
                               String logoUrl, List<ClinicServiceSummaryDto> services) {}

    public record MyClinicAppointmentDto(Long id, String psychologistName, String psychologistAvatarUrl,
                                          String startTime, String endTime, String status,
                                          String service, BigDecimal price, String paymentStatus,
                                          String modality) {}

    public record MyClinicDocumentDto(Long id, String originalName, String fileName, Long fileSize, String uploadedAt) {}

    // --- Endpoints ---

    @Transactional(readOnly = true)
    public MyClinicDto getMyClinic(UserEntity user) {
        Long companyId = resolveCompanyId(user);
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No perteneces a ninguna clínica");
        }

        CompanyEntity company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clínica no encontrada"));

        List<ClinicServiceSummaryDto> services = clinicServiceRepository
                .findByCompanyIdOrderByNameAsc(companyId).stream()
                .filter(s -> Boolean.TRUE.equals(s.getActive()))
                .map(s -> new ClinicServiceSummaryDto(s.getId(), s.getName(), s.getDefaultPrice(), s.getDurationMinutes()))
                .collect(Collectors.toList());

        return new MyClinicDto(company.getId(), company.getName(), company.getAddress(),
                company.getPhone(), company.getWebsite(), company.getLogoUrl(), services);
    }

    @Transactional(readOnly = true)
    public List<MyClinicAppointmentDto> getMyClinicAppointments(UserEntity user) {
        Long companyId = resolveCompanyId(user);
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No perteneces a ninguna clínica");
        }

        // Get all appointments for the user, then filter by psychologist belonging to the same company
        List<AppointmentEntity> allAppts = appointmentRepository.findByUser_IdOrderByStartTimeAsc(user.getId());

        List<MyClinicAppointmentDto> result = new ArrayList<>();
        for (AppointmentEntity a : allAppts) {
            UserEntity psych = a.getPsychologist();
            if (psych != null && companyId.equals(psych.getCompanyId())) {
                result.add(new MyClinicAppointmentDto(
                        a.getId(),
                        psych.getName(),
                        psych.getAvatarUrl(),
                        a.getStartTime() != null ? a.getStartTime().toString() : null,
                        a.getEndTime() != null ? a.getEndTime().toString() : null,
                        a.getStatus() != null ? a.getStatus().name() : null,
                        a.getService(),
                        a.getPrice(),
                        a.getPaymentStatus() != null ? a.getPaymentStatus().name() : null,
                        a.getModality() != null ? a.getModality() : "ONLINE"
                ));
            }
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<MyClinicDocumentDto> getMyClinicDocuments(UserEntity user) {
        Long companyId = resolveCompanyId(user);
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No perteneces a ninguna clínica");
        }

        return clinicPatientDocumentRepository
                .findByCompanyIdAndPatientIdOrderByUploadedAtDesc(companyId, user.getId()).stream()
                .map(d -> new MyClinicDocumentDto(d.getId(), d.getOriginalName(), d.getFileName(),
                        d.getFileSize(), d.getUploadedAt().toString()))
                .collect(Collectors.toList());
    }

    /**
     * Resolves the company ID for a patient user.
     * First checks user's direct companyId, then checks if the assigned psychologist has a companyId.
     */
    private Long resolveCompanyId(UserEntity user) {
        // Direct company assignment
        if (user.getCompanyId() != null) {
            return user.getCompanyId();
        }
        // Check via assigned psychologist
        var rel = userPsychologistRepository.findByUserId(user.getId());
        if (rel.isPresent()) {
            UserEntity psych = rel.get().getPsychologist();
            if (psych != null && psych.getCompanyId() != null) {
                return psych.getCompanyId();
            }
        }
        return null;
    }
}
