package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.alvaro.psicoapp.util.InputSanitizer;

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
                                         String specializations, String languages) {}

    public record PublicServiceDto(Long id, String name, BigDecimal price, Integer durationMinutes) {}

    public record PublicSlotDto(Long appointmentId, Long psychologistId, String psychologistName,
                                String startTime, String endTime, String service) {}

    public record PublicBookingRequest(String patientName, String patientEmail, String patientPhone,
                                        Long psychologistId, Long appointmentId, Long serviceId,
                                        String notes) {}

    public record PublicBookingResponse(String status, String message) {}

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
                                profile.getLanguages());
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
        // Limit query window to 90 days max to prevent resource abuse
        if (from != null && to != null && to.getEpochSecond() - from.getEpochSecond() > 90L * 24 * 3600) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El rango máximo es de 90 días");
        }

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

        // Sanitize all user-supplied input to prevent stored XSS
        String sanitizedName = InputSanitizer.sanitizeAndValidate(req.patientName(), 200);
        if (sanitizedName == null || sanitizedName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del paciente es obligatorio");
        }
        String sanitizedEmail = req.patientEmail() != null && !req.patientEmail().isBlank()
                ? InputSanitizer.sanitizeAndValidate(req.patientEmail(), 255) : null;
        String sanitizedPhone = req.patientPhone() != null && !req.patientPhone().isBlank()
                ? InputSanitizer.sanitizeAndValidate(req.patientPhone(), 30) : null;
        String sanitizedNotes = req.notes() != null && !req.notes().isBlank()
                ? InputSanitizer.sanitizeAndValidate(req.notes(), 1000) : null;

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
                appointment.setNotes("Solicitud web: " + sanitizedName
                        + (sanitizedEmail != null ? " (" + sanitizedEmail + ")" : "")
                        + (sanitizedPhone != null ? " Tel: " + sanitizedPhone : "")
                        + (sanitizedNotes != null ? " — " + sanitizedNotes : ""));
                appointmentRepository.save(appointment);

                logger.info("Public booking request for slot {} at clinic {}", req.appointmentId(), slug);
                return new PublicBookingResponse("REQUESTED",
                        "Tu solicitud ha sido registrada. La clínica te contactará para confirmar.");
            }
        }

        // No available slot or no appointmentId — add to waiting list
        WaitingListEntity entry = new WaitingListEntity();
        entry.setCompanyId(company.getId());
        entry.setPatientName(sanitizedName);
        entry.setPatientEmail(sanitizedEmail);
        entry.setPatientPhone(sanitizedPhone);
        if (sanitizedNotes != null) entry.setNotes(sanitizedNotes);

        if (req.psychologistId() != null) {
            // Verify the psychologist belongs to this clinic
            userRepository.findById(req.psychologistId())
                    .filter(u -> company.getId().equals(u.getCompanyId()))
                    .ifPresent(entry::setPsychologistPreference);
        }

        if (req.serviceId() != null) {
            // Verify the service belongs to this clinic
            clinicServiceRepository.findById(req.serviceId())
                    .filter(s -> company.getId().equals(s.getCompanyId()))
                    .ifPresent(entry::setRequestedService);
        }

        waitingListRepository.save(entry);
        logger.info("Added to waiting list via public page: clinic={}, patient={}", slug, sanitizedName);
        return new PublicBookingResponse("WAITING_LIST",
                "No hay citas disponibles en este momento. Te hemos añadido a la lista de espera.");
    }
}
