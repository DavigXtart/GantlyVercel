package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PublicClinicService {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(PublicClinicService.class);

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final PsychologistProfileRepository psychologistProfileRepository;
    private final ClinicServiceRepository clinicServiceRepository;
    private final AppointmentRepository appointmentRepository;
    private final WaitingListRepository waitingListRepository;

    public PublicClinicService(CompanyRepository companyRepository,
                               UserRepository userRepository,
                               PsychologistProfileRepository psychologistProfileRepository,
                               ClinicServiceRepository clinicServiceRepository,
                               AppointmentRepository appointmentRepository,
                               WaitingListRepository waitingListRepository) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.psychologistProfileRepository = psychologistProfileRepository;
        this.clinicServiceRepository = clinicServiceRepository;
        this.appointmentRepository = appointmentRepository;
        this.waitingListRepository = waitingListRepository;
    }

    // --- DTOs ---
    public record PublicClinicInfoDto(Long id, String name, String slug, String description,
                                      String address, String phone, String website, String logoUrl,
                                      String weeklySchedule,
                                      List<PublicServiceDto> services,
                                      List<PublicPsychologistDto> psychologists) {}

    public record PublicPsychologistDto(Long id, String name, String avatarUrl, String bio,
                                         String specializations, String languages,
                                         String licenseNumber) {}

    public record PublicServiceDto(Long id, String name, BigDecimal price, Integer durationMinutes) {}

    public record PublicSlotDto(Long appointmentId, Long psychologistId, String psychologistName,
                                String startTime, String endTime, String service) {}

    public record PublicBookingRequest(String patientName, String patientEmail, String patientPhone,
                                        Long psychologistId, Long appointmentId, Long serviceId,
                                        String notes) {}

    public record PublicBookingResponse(String status, String message, Long waitingListId) {}

    public PublicClinicInfoDto getClinicPublicInfo(String slug) {
        CompanyEntity company = companyRepository.findBySlugAndPublicVisibleTrue(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clínica no encontrada"));

        List<UserEntity> psychologists = userRepository.findByCompanyId(company.getId()).stream()
                .filter(u -> "PSYCHOLOGIST".equals(u.getRole()))
                .collect(Collectors.toList());

        List<PublicPsychologistDto> psychDtos = psychologists.stream()
                .map(u -> {
                    PsychologistProfileEntity profile = psychologistProfileRepository.findByUser_Id(u.getId())
                            .orElse(null);
                    if (profile != null && Boolean.TRUE.equals(profile.getApproved())) {
                        return new PublicPsychologistDto(
                                u.getId(), u.getName(), u.getAvatarUrl(),
                                profile.getBio(), profile.getSpecializations(),
                                profile.getLanguages(), profile.getLicenseNumber());
                    }
                    return null;
                })
                .filter(p -> p != null)
                .collect(Collectors.toList());

        List<PublicServiceDto> serviceDtos = clinicServiceRepository.findByCompanyIdOrderByNameAsc(company.getId())
                .stream()
                .filter(s -> Boolean.TRUE.equals(s.getActive()))
                .map(s -> new PublicServiceDto(s.getId(), s.getName(), s.getDefaultPrice(), s.getDurationMinutes()))
                .collect(Collectors.toList());

        return new PublicClinicInfoDto(
                company.getId(), company.getName(), company.getSlug(), company.getDescription(),
                company.getAddress(), company.getPhone(), company.getWebsite(), company.getLogoUrl(),
                company.getWeeklySchedule(),
                serviceDtos, psychDtos);
    }

    public List<PublicSlotDto> getAvailableSlots(String slug, Instant from, Instant to,
                                                  Long psychologistId, Long serviceId) {
        CompanyEntity company = companyRepository.findBySlugAndPublicVisibleTrue(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clínica no encontrada"));

        List<UserEntity> psychologists = userRepository.findByCompanyId(company.getId()).stream()
                .filter(u -> "PSYCHOLOGIST".equals(u.getRole()))
                .filter(u -> psychologistId == null || u.getId().equals(psychologistId))
                .collect(Collectors.toList());

        return psychologists.stream()
                .flatMap(psych -> {
                    List<AppointmentEntity> slots = appointmentRepository
                            .findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(psych.getId(), from, to);
                    return slots.stream()
                            .filter(a -> a.getStatus() == AppointmentStatusEnum.FREE)
                            .map(a -> new PublicSlotDto(
                                    a.getId(), psych.getId(), psych.getName(),
                                    a.getStartTime().toString(), a.getEndTime().toString(),
                                    a.getService()));
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public PublicBookingResponse submitBookingRequest(String slug, PublicBookingRequest req) {
        CompanyEntity company = companyRepository.findBySlugAndPublicVisibleTrue(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clínica no encontrada"));

        if (req.patientName() == null || req.patientName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del paciente es obligatorio");
        }

        // If an appointmentId is provided, try to book that specific slot
        if (req.appointmentId() != null) {
            AppointmentEntity appointment = appointmentRepository.findById(req.appointmentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));

            // Verify the appointment belongs to a psychologist of this clinic
            if (!company.getId().equals(appointment.getPsychologist().getCompanyId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La cita no pertenece a esta clínica");
            }

            if (appointment.getStatus() == AppointmentStatusEnum.FREE) {
                // Mark the slot as requested - clinic will confirm
                appointment.setStatus(AppointmentStatusEnum.REQUESTED);
                appointment.setNotes("Solicitud web: " + req.patientName()
                        + (req.patientEmail() != null ? " (" + req.patientEmail() + ")" : "")
                        + (req.patientPhone() != null ? " Tel: " + req.patientPhone() : "")
                        + (req.notes() != null ? " — " + req.notes() : ""));
                appointmentRepository.save(appointment);

                logger.info("Public booking request for slot {} at clinic {}", req.appointmentId(), slug);
                return new PublicBookingResponse("REQUESTED",
                        "Tu solicitud ha sido registrada. La clínica te contactará para confirmar.", null);
            }
        }

        // No available slot or no appointmentId — add to waiting list
        WaitingListEntity entry = new WaitingListEntity();
        entry.setCompanyId(company.getId());
        entry.setPatientName(req.patientName());
        entry.setPatientEmail(req.patientEmail());
        entry.setPatientPhone(req.patientPhone());
        if (req.notes() != null) entry.setNotes(req.notes());

        if (req.psychologistId() != null) {
            userRepository.findById(req.psychologistId()).ifPresent(entry::setPsychologistPreference);
        }

        if (req.serviceId() != null) {
            clinicServiceRepository.findById(req.serviceId()).ifPresent(entry::setRequestedService);
        }

        WaitingListEntity saved = waitingListRepository.save(entry);
        logger.info("Added to waiting list via public page: clinic={}, patient={}", slug, req.patientName());
        return new PublicBookingResponse("WAITING_LIST",
                "No hay citas disponibles en este momento. Te hemos añadido a la lista de espera.",
                saved.getId());
    }
}
