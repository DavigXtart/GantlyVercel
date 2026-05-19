package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.repository.*;
import com.alvaro.psicoapp.domain.AppointmentStatusEnum;
import com.alvaro.psicoapp.domain.PaymentStatusEnum;
import com.alvaro.psicoapp.domain.ClinicRoomEntity;
import com.alvaro.psicoapp.domain.ClinicServiceEntity;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;
import com.alvaro.psicoapp.config.AppTimezone;
import com.alvaro.psicoapp.domain.ClinicInvitationEntity;
import com.alvaro.psicoapp.repository.ClinicAdminRepository;
import com.alvaro.psicoapp.repository.ClinicInvitationRepository;
import com.alvaro.psicoapp.repository.ClinicServiceRepository;
import org.springframework.beans.factory.annotation.Value;
import java.util.UUID;
import java.util.Map;

@Service
public class ClinicService {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(ClinicService.class);

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserPsychologistRepository userPsychologistRepository;
    private final ClinicPatientProfileRepository clinicPatientProfileRepository;
    private final ClinicInvitationRepository clinicInvitationRepository;
    private final ClinicPatientDocumentRepository clinicPatientDocumentRepository;
    private final ClinicRoomRepository clinicRoomRepository;
    private final ClinicServiceRepository clinicServiceRepository;
    private final ClinicAdminRepository clinicAdminRepository;
    private final PsychAbsenceRepository psychAbsenceRepository;
    private final EmailService emailService;
    private final StripeService stripeService;
    private final AuditService auditService;

    @Value("${app.base.url:http://localhost:5173}")
    private String baseUrl;

    public ClinicService(CompanyRepository companyRepository,
                         UserRepository userRepository,
                         AppointmentRepository appointmentRepository,
                         UserPsychologistRepository userPsychologistRepository,
                         ClinicPatientProfileRepository clinicPatientProfileRepository,
                         ClinicInvitationRepository clinicInvitationRepository,
                         ClinicPatientDocumentRepository clinicPatientDocumentRepository,
                         ClinicRoomRepository clinicRoomRepository,
                         ClinicServiceRepository clinicServiceRepository,
                         ClinicAdminRepository clinicAdminRepository,
                         PsychAbsenceRepository psychAbsenceRepository,
                         EmailService emailService,
                         StripeService stripeService,
                         AuditService auditService) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.clinicPatientProfileRepository = clinicPatientProfileRepository;
        this.clinicInvitationRepository = clinicInvitationRepository;
        this.clinicPatientDocumentRepository = clinicPatientDocumentRepository;
        this.clinicRoomRepository = clinicRoomRepository;
        this.clinicServiceRepository = clinicServiceRepository;
        this.clinicAdminRepository = clinicAdminRepository;
        this.psychAbsenceRepository = psychAbsenceRepository;
        this.emailService = emailService;
        this.stripeService = stripeService;
        this.auditService = auditService;
    }

    // --- DTOs ---
    public record ClinicMeDto(Long id, String name, String email, String referralCode,
                              String address, String phone, String website, String logoUrl,
                              String weeklySchedule, String nif) {}
    public record UpdateClinicInfoRequest(String name, String address, String phone, String website,
                                           String logoUrl, String weeklySchedule, String nif) {}
    public record ClinicServiceDto(Long id, String name, BigDecimal defaultPrice, Integer durationMinutes, Boolean active) {}
    public record CreateClinicServiceRequest(String name, BigDecimal defaultPrice, Integer durationMinutes) {}
    public record UpdateClinicServiceRequest(String name, BigDecimal defaultPrice, Integer durationMinutes, Boolean active) {}
    public record ClinicPsychologistDto(Long id, String name, String email, String avatarUrl) {}
    public record ClinicAppointmentDto(Long id, Long psychologistId, String psychologistName,
                                        String psychologistAvatarUrl, Long patientId, String patientName,
                                        String startTime, String endTime, String status, String service,
                                        BigDecimal price, String paymentStatus, String notes, String clinicNotes,
                                        String modality, String paymentMethod, Long roomId, String roomName,
                                        Boolean taxExempt, BigDecimal taxRate, BigDecimal taxAmount, BigDecimal totalAmount) {}
    public record ClinicPatientSummaryDto(Long id, String name, String email, String phone,
                                           Integer patientNumber, String status,
                                           String assignedPsychologistName, long totalAppointments) {}
    public record ClinicPatientDetailDto(Long id, String name, String email, String phone, String birthDate,
                                          String gender, Integer patientNumber, String status, String notes,
                                          String allergies, String medication, String medicalHistory,
                                          Boolean consentSigned, String patientType,
                                          Long psychologistId, String psychologistName,
                                          List<ClinicAppointmentDto> appointments) {}
    public record ClinicBillingDto(Long appointmentId, String startTime, String endTime, Long psychologistId,
                                    String psychologistName, Long patientId, String patientName,
                                    String service, BigDecimal price, String paymentStatus,
                                    String modality, String paymentMethod,
                                    BigDecimal taxRate, BigDecimal taxAmount, BigDecimal totalAmount, Boolean taxExempt) {}
    public record CreateAppointmentRequest(Long psychologistId, Long patientId, String patientName,
                                            String startTime, String endTime, String service,
                                            BigDecimal price, String notes, String clinicNotes,
                                            String paymentStatus, String modality, String paymentMethod,
                                            Long roomId, Boolean taxExempt, BigDecimal taxRate,
                                            String recurrenceRule, Integer recurrenceCount,
                                            Long serviceId) {}
    public record UpdateAppointmentRequest(Long patientId, String patientName, String startTime, String endTime,
                                            String service, BigDecimal price, String notes, String clinicNotes,
                                            String paymentStatus, String modality, String paymentMethod,
                                            Long roomId) {}
    public record UpdatePatientRequest(String notes, String allergies, String medication, String medicalHistory,
                                        Boolean consentSigned, String patientType, String status, String phone) {}
    public record InvitationDto(Long id, String email, String status, String createdAt, String expiresAt) {}
    public record SendInvitationRequest(String email) {}
    // Room DTOs
    public record ClinicRoomDto(Long id, String name, String color, Long assignedPsychologistId, Boolean active) {}
    public record CreateRoomRequest(String name, String color, Long assignedPsychologistId) {}
    public record UpdateRoomRequest(String name, String color, Long assignedPsychologistId, Boolean active) {}
    // Multi-admin DTOs
    public record ClinicAdminDto(Long id, Long userId, String userName, String userEmail, String avatarUrl,
                                  String role, String status, String invitedByEmail,
                                  String invitedAt, String acceptedAt) {}
    public record InviteAdminRequest(String email, String role) {}

    private CompanyEntity getCompany(String email) {
        return companyRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empresa no encontrada"));
    }

    private void assertPsychBelongsToCompany(UserEntity psych, Long companyId) {
        if (!companyId.equals(psych.getCompanyId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este psicólogo no pertenece a tu empresa");
        }
    }

    private ClinicAppointmentDto toAppointmentDto(AppointmentEntity a, UserEntity psych) {
        String patientName = a.getUser() != null ? a.getUser().getName() : null;
        Long patientId = a.getUser() != null ? a.getUser().getId() : null;
        String roomName = null;
        if (a.getRoomId() != null) {
            roomName = clinicRoomRepository.findById(a.getRoomId())
                    .map(ClinicRoomEntity::getName).orElse(null);
        }
        return new ClinicAppointmentDto(
                a.getId(), psych.getId(), psych.getName(), psych.getAvatarUrl(),
                patientId, patientName,
                a.getStartTime() != null ? a.getStartTime().toString() : null,
                a.getEndTime() != null ? a.getEndTime().toString() : null,
                a.getStatus() != null ? a.getStatus().name() : null, a.getService(), a.getPrice(),
                a.getPaymentStatus() != null ? a.getPaymentStatus().name() : null,
                a.getNotes(), a.getClinicNotes(),
                a.getModality() != null ? a.getModality() : "ONLINE",
                a.getPaymentMethod() != null ? a.getPaymentMethod() : "STRIPE",
                a.getRoomId(), roomName,
                a.getTaxExempt(), a.getTaxRate(), a.getTaxAmount(), a.getTotalAmount());
    }

    @Transactional(readOnly = true)
    public ClinicMeDto getMe(String email) {
        var company = getCompany(email);
        return new ClinicMeDto(company.getId(), company.getName(), company.getEmail(), company.getReferralCode(),
                company.getAddress(), company.getPhone(), company.getWebsite(), company.getLogoUrl(),
                company.getWeeklySchedule(), company.getNif());
    }

    @Transactional
    public ClinicMeDto updateClinicInfo(String email, UpdateClinicInfoRequest req) {
        var company = getCompany(email);
        if (req.name() != null && !req.name().isBlank()) company.setName(req.name().trim());
        if (req.address() != null) company.setAddress(req.address().trim());
        if (req.phone() != null) company.setPhone(req.phone().trim());
        if (req.website() != null) company.setWebsite(req.website().trim());
        if (req.logoUrl() != null) company.setLogoUrl(req.logoUrl().trim());
        if (req.weeklySchedule() != null) company.setWeeklySchedule(req.weeklySchedule());
        if (req.nif() != null) company.setNif(req.nif().trim());
        companyRepository.save(company);
        return getMe(email);
    }

    @Transactional(readOnly = true)
    public List<ClinicServiceDto> getServices(String email) {
        var company = getCompany(email);
        return clinicServiceRepository.findByCompanyIdOrderByNameAsc(company.getId()).stream()
                .map(s -> new ClinicServiceDto(s.getId(), s.getName(), s.getDefaultPrice(), s.getDurationMinutes(), s.getActive()))
                .collect(Collectors.toList());
    }

    @Transactional
    public ClinicServiceDto createService(String email, CreateClinicServiceRequest req) {
        var company = getCompany(email);
        if (req.name() == null || req.name().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del servicio es obligatorio");
        ClinicServiceEntity svc = new ClinicServiceEntity();
        svc.setCompanyId(company.getId());
        svc.setName(req.name().trim());
        svc.setDefaultPrice(req.defaultPrice());
        svc.setDurationMinutes(req.durationMinutes());
        svc.setActive(true);
        clinicServiceRepository.save(svc);
        return new ClinicServiceDto(svc.getId(), svc.getName(), svc.getDefaultPrice(), svc.getDurationMinutes(), svc.getActive());
    }

    @Transactional
    public ClinicServiceDto updateService(String email, Long serviceId, UpdateClinicServiceRequest req) {
        var company = getCompany(email);
        ClinicServiceEntity svc = clinicServiceRepository.findById(serviceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Servicio no encontrado"));
        if (!company.getId().equals(svc.getCompanyId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
        if (req.name() != null && !req.name().isBlank()) svc.setName(req.name().trim());
        if (req.defaultPrice() != null) svc.setDefaultPrice(req.defaultPrice());
        if (req.durationMinutes() != null) svc.setDurationMinutes(req.durationMinutes());
        if (req.active() != null) svc.setActive(req.active());
        clinicServiceRepository.save(svc);
        return new ClinicServiceDto(svc.getId(), svc.getName(), svc.getDefaultPrice(), svc.getDurationMinutes(), svc.getActive());
    }

    @Transactional
    public void deleteService(String email, Long serviceId) {
        var company = getCompany(email);
        ClinicServiceEntity svc = clinicServiceRepository.findById(serviceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Servicio no encontrado"));
        if (!company.getId().equals(svc.getCompanyId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
        clinicServiceRepository.delete(svc);
    }

    @Transactional(readOnly = true)
    public List<ClinicPsychologistDto> getPsychologists(String email) {
        var company = getCompany(email);
        return userRepository.findByCompanyId(company.getId()).stream()
                .filter(u -> RoleConstants.PSYCHOLOGIST.equals(u.getRole()))
                .map(u -> new ClinicPsychologistDto(u.getId(), u.getName(), u.getEmail(), u.getAvatarUrl()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClinicAppointmentDto> getAgenda(String email, Instant from, Instant to) {
        var company = getCompany(email);
        List<UserEntity> psychs = userRepository.findByCompanyId(company.getId()).stream()
                .filter(u -> RoleConstants.PSYCHOLOGIST.equals(u.getRole()))
                .collect(Collectors.toList());

        List<ClinicAppointmentDto> result = new ArrayList<>();
        for (UserEntity psych : psychs) {
            List<AppointmentEntity> appts = appointmentRepository
                    .findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(psych.getId(), from, to);
            for (AppointmentEntity a : appts) {
                result.add(toAppointmentDto(a, psych));
            }
        }
        return result;
    }

    @Transactional
    public List<ClinicAppointmentDto> createAppointment(String email, CreateAppointmentRequest req) {
        var company = getCompany(email);
        UserEntity psych = userRepository.findById(req.psychologistId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Psicólogo no encontrado"));
        assertPsychBelongsToCompany(psych, company.getId());

        UserEntity patient = null;
        if (req.patientId() != null) {
            patient = userRepository.findById(req.patientId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));
        }

        // Auto-populate from service catalog if serviceId is provided
        ClinicServiceEntity catalogService = null;
        if (req.serviceId() != null) {
            catalogService = clinicServiceRepository.findById(req.serviceId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Servicio no encontrado"));
            if (!company.getId().equals(catalogService.getCompanyId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este servicio no pertenece a tu empresa");
            }
            if (!Boolean.TRUE.equals(catalogService.getActive())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este servicio no está activo");
            }
        }

        // Determine service name, price, and endTime from catalog or request
        String serviceName = req.service();
        BigDecimal servicePrice = req.price();
        if (catalogService != null) {
            if (serviceName == null || serviceName.isBlank()) serviceName = catalogService.getName();
            if (servicePrice == null) servicePrice = catalogService.getDefaultPrice();
        }

        Instant baseStart = Instant.parse(req.startTime());
        Instant baseEnd;
        if (req.endTime() != null) {
            baseEnd = Instant.parse(req.endTime());
        } else if (catalogService != null && catalogService.getDurationMinutes() != null) {
            baseEnd = baseStart.plusSeconds(catalogService.getDurationMinutes() * 60L);
        } else {
            baseEnd = baseStart.plusSeconds(3600); // Default 1 hour
        }

        // Determine recurrence parameters
        String groupId = null;
        int count = 1;
        if (req.recurrenceRule() != null && req.recurrenceCount() != null && req.recurrenceCount() > 1) {
            groupId = UUID.randomUUID().toString();
            count = Math.min(req.recurrenceCount(), 52);
        }

        List<ClinicAppointmentDto> created = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            Instant start = offsetTime(baseStart, req.recurrenceRule(), i);
            Instant end = offsetTime(baseEnd, req.recurrenceRule(), i);

            // Check double-booking
            if (appointmentRepository.existsActiveAppointment(psych.getId(), start)) {
                if (i == 0) throw new IllegalArgumentException("Este horario ya está reservado");
                continue; // Skip conflicting recurring slots
            }

            // Check absence overlap for recurring appointments
            if (i > 0) {
                var absences = psychAbsenceRepository.findOverlapping(psych.getId(), start, end);
                if (!absences.isEmpty()) continue; // Skip slots overlapping absences
            }

            AppointmentEntity appt = new AppointmentEntity();
            appt.setPsychologist(psych);
            appt.setUser(patient);
            appt.setStartTime(start);
            appt.setEndTime(end);
            appt.setStatus(AppointmentStatusEnum.CONFIRMED);
            appt.setService(serviceName);
            appt.setPrice(servicePrice);
            appt.setNotes(req.notes());
            appt.setClinicNotes(req.clinicNotes());
            String paymentMethod = req.paymentMethod() != null ? req.paymentMethod() : "STRIPE";
            appt.setPaymentMethod(paymentMethod);
            appt.setModality(req.modality() != null ? req.modality() : "ONLINE");
            // CASH appointments are pre-paid by definition — auto-set to PAID so Jitsi won't block
            if ("CASH".equalsIgnoreCase(paymentMethod)) {
                appt.setPaymentStatus(PaymentStatusEnum.PAID);
            } else {
                appt.setPaymentStatus(req.paymentStatus() != null ? PaymentStatusEnum.valueOf(req.paymentStatus()) : PaymentStatusEnum.PENDING);
            }
            appt.setRoomId(req.roomId());
            appt.setTaxExempt(req.taxExempt() != null ? req.taxExempt() : true);
            if (req.taxRate() != null) appt.setTaxRate(req.taxRate());
            appt.setRecurrenceGroupId(groupId);
            appt.setRecurrenceRule(req.recurrenceRule());
            calculateTax(appt);
            appt.setConfirmedAt(Instant.now());
            appointmentRepository.save(appt);

            created.add(toAppointmentDto(appt, psych));
        }

        if (created.isEmpty()) {
            throw new IllegalArgumentException("No se pudo crear ninguna cita");
        }

        for (ClinicAppointmentDto dto : created) {
            auditService.persistAudit("CREATE_APPOINTMENT", "APPOINTMENT", dto.id(),
                    req.psychologistId(), RoleConstants.PSYCHOLOGIST, psych.getName(),
                    req.patientId(),
                    "{\"service\":\"" + (req.service() != null ? req.service() : "") + "\",\"source\":\"CLINIC\",\"count\":" + created.size() + "}");
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
    public ClinicAppointmentDto updateAppointment(String email, Long appointmentId, UpdateAppointmentRequest req) {
        var company = getCompany(email);
        AppointmentEntity appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));
        assertPsychBelongsToCompany(appt.getPsychologist(), company.getId());

        if (req.startTime() != null) appt.setStartTime(Instant.parse(req.startTime()));
        if (req.endTime() != null) appt.setEndTime(Instant.parse(req.endTime()));
        if (req.service() != null) appt.setService(req.service());
        if (req.price() != null) appt.setPrice(req.price());
        if (req.notes() != null) appt.setNotes(req.notes());
        if (req.clinicNotes() != null) appt.setClinicNotes(req.clinicNotes());
        if (req.modality() != null) appt.setModality(req.modality());
        if (req.paymentMethod() != null) {
            appt.setPaymentMethod(req.paymentMethod());
            // CASH appointments are pre-paid by definition — auto-set to PAID so Jitsi won't block
            if ("CASH".equalsIgnoreCase(req.paymentMethod())) {
                appt.setPaymentStatus(PaymentStatusEnum.PAID);
            }
        }
        if (req.paymentStatus() != null && !"CASH".equalsIgnoreCase(appt.getPaymentMethod())) {
            appt.setPaymentStatus(PaymentStatusEnum.valueOf(req.paymentStatus()));
        }
        appt.setRoomId(req.roomId()); // null = quitar despacho
        if (req.patientId() != null) {
            UserEntity patient = userRepository.findById(req.patientId()).orElse(null);
            appt.setUser(patient);
        }
        // Recalculate tax if price changed
        if (req.price() != null) {
            calculateTax(appt);
        }
        appointmentRepository.save(appt);

        auditService.persistAudit("UPDATE_APPOINTMENT", "APPOINTMENT", appointmentId,
                appt.getPsychologist().getId(), RoleConstants.PSYCHOLOGIST, appt.getPsychologist().getName(),
                appt.getUser() != null ? appt.getUser().getId() : null,
                "{\"source\":\"CLINIC\"}");

        return toAppointmentDto(appt, appt.getPsychologist());
    }

    @Transactional
    public void cancelAppointment(String email, Long appointmentId) {
        var company = getCompany(email);
        AppointmentEntity appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));
        assertPsychBelongsToCompany(appt.getPsychologist(), company.getId());
        appt.setStatus(AppointmentStatusEnum.CANCELLED);
        appointmentRepository.save(appt);

        auditService.persistAudit("CANCEL_APPOINTMENT", "APPOINTMENT", appointmentId,
                appt.getPsychologist().getId(), RoleConstants.PSYCHOLOGIST, appt.getPsychologist().getName(),
                appt.getUser() != null ? appt.getUser().getId() : null,
                "{\"source\":\"CLINIC\"}");
    }

    @Transactional(readOnly = true)
    public List<ClinicPatientSummaryDto> getPatients(String email, String search) {
        var company = getCompany(email);
        List<UserEntity> psychs = userRepository.findByCompanyId(company.getId()).stream()
                .filter(u -> RoleConstants.PSYCHOLOGIST.equals(u.getRole()))
                .collect(Collectors.toList());

        Map<Long, ClinicPatientSummaryDto> deduped = new LinkedHashMap<>();

        for (UserEntity psych : psychs) {
            List<UserPsychologistEntity> rels = userPsychologistRepository.findByPsychologist_Id(psych.getId());
            for (UserPsychologistEntity rel : rels) {
                UserEntity patient = rel.getUser();
                if (deduped.containsKey(patient.getId())) continue;

                if (search != null && !search.isBlank()) {
                    String s = search.toLowerCase();
                    if (!patient.getName().toLowerCase().contains(s)
                            && !patient.getEmail().toLowerCase().contains(s)) continue;
                }

                var profile = clinicPatientProfileRepository
                        .findByCompanyIdAndPatientId(company.getId(), patient.getId()).orElse(null);

                long totalAppts = appointmentRepository
                        .findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(
                                psych.getId(),
                                Instant.ofEpochMilli(0),
                                Instant.now().plusSeconds(365L * 24 * 3600))
                        .stream()
                        .filter(a -> a.getUser() != null && a.getUser().getId().equals(patient.getId()))
                        .count();

                deduped.put(patient.getId(), new ClinicPatientSummaryDto(
                        patient.getId(), patient.getName(), patient.getEmail(),
                        profile != null ? profile.getPhone() : null,
                        profile != null ? profile.getPatientNumber() : null,
                        profile != null ? profile.getStatus() : "ACTIVE",
                        psych.getName(),
                        totalAppts));
            }
        }
        return new ArrayList<>(deduped.values());
    }

    @Transactional(readOnly = true)
    public ClinicPatientDetailDto getPatient(String email, Long patientId) {
        var company = getCompany(email);
        UserEntity patient = userRepository.findById(patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));

        var rel = userPsychologistRepository.findByUserId(patientId);
        UserEntity psych = null;
        if (rel.isPresent()) {
            psych = rel.get().getPsychologist();
            if (!company.getId().equals(psych.getCompanyId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este paciente no pertenece a tu empresa");
            }
        }

        var profile = clinicPatientProfileRepository
                .findByCompanyIdAndPatientId(company.getId(), patientId).orElse(null);

        List<ClinicAppointmentDto> appointments = new ArrayList<>();
        if (psych != null) {
            final UserEntity finalPsych = psych;
            appointments = appointmentRepository
                    .findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(
                            psych.getId(),
                            Instant.ofEpochMilli(0),
                            Instant.now().plusSeconds(365L * 24 * 3600))
                    .stream()
                    .filter(a -> a.getUser() != null && a.getUser().getId().equals(patientId))
                    .map(a -> toAppointmentDto(a, finalPsych))
                    .sorted(Comparator.comparing(ClinicAppointmentDto::startTime).reversed())
                    .collect(Collectors.toList());
        }

        return new ClinicPatientDetailDto(
                patient.getId(), patient.getName(), patient.getEmail(),
                profile != null ? profile.getPhone() : null,
                patient.getBirthDate() != null ? patient.getBirthDate().toString() : null,
                patient.getGender(),
                profile != null ? profile.getPatientNumber() : null,
                profile != null ? profile.getStatus() : "ACTIVE",
                profile != null ? profile.getNotes() : null,
                profile != null ? profile.getAllergies() : null,
                profile != null ? profile.getMedication() : null,
                profile != null ? profile.getMedicalHistory() : null,
                profile != null ? profile.getConsentSigned() : false,
                profile != null ? profile.getPatientType() : "PRIVATE",
                psych != null ? psych.getId() : null,
                psych != null ? psych.getName() : null,
                appointments);
    }

    @Transactional
    public ClinicPatientDetailDto updatePatient(String email, Long patientId, UpdatePatientRequest req) {
        var company = getCompany(email);
        userRepository.findById(patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));

        var rel = userPsychologistRepository.findByUserId(patientId);
        if (rel.isPresent() && !company.getId().equals(rel.get().getPsychologist().getCompanyId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este paciente no pertenece a tu empresa");
        }

        var profile = clinicPatientProfileRepository
                .findByCompanyIdAndPatientId(company.getId(), patientId)
                .orElseGet(() -> {
                    var p = new ClinicPatientProfileEntity();
                    p.setCompanyId(company.getId());
                    p.setPatientId(patientId);
                    int count = clinicPatientProfileRepository.countByCompanyId(company.getId());
                    p.setPatientNumber(count + 1);
                    return p;
                });

        if (req.notes() != null) profile.setNotes(req.notes());
        if (req.allergies() != null) profile.setAllergies(req.allergies());
        if (req.medication() != null) profile.setMedication(req.medication());
        if (req.medicalHistory() != null) profile.setMedicalHistory(req.medicalHistory());
        if (req.consentSigned() != null) profile.setConsentSigned(req.consentSigned());
        if (req.patientType() != null) profile.setPatientType(req.patientType());
        if (req.status() != null) profile.setStatus(req.status());
        if (req.phone() != null) profile.setPhone(req.phone());
        profile.setUpdatedAt(Instant.now());
        clinicPatientProfileRepository.save(profile);

        return getPatient(email, patientId);
    }

    @Transactional(readOnly = true)
    public List<ClinicBillingDto> getBilling(String email, Instant from, Instant to, Long psychologistId) {
        var company = getCompany(email);
        List<UserEntity> psychs = userRepository.findByCompanyId(company.getId()).stream()
                .filter(u -> RoleConstants.PSYCHOLOGIST.equals(u.getRole()))
                .filter(u -> psychologistId == null || u.getId().equals(psychologistId))
                .collect(Collectors.toList());

        List<ClinicBillingDto> result = new ArrayList<>();
        for (UserEntity psych : psychs) {
            List<AppointmentEntity> appts = appointmentRepository
                    .findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(psych.getId(), from, to);
            for (AppointmentEntity a : appts) {
                if (a.getStatus() == AppointmentStatusEnum.FREE) continue;
                String patientName = a.getUser() != null ? a.getUser().getName() : null;
                Long pid = a.getUser() != null ? a.getUser().getId() : null;
                result.add(new ClinicBillingDto(
                        a.getId(), a.getStartTime().toString(), a.getEndTime().toString(),
                        psych.getId(), psych.getName(), pid, patientName,
                        a.getService(), a.getPrice(),
                        a.getPaymentStatus() != null ? a.getPaymentStatus().name() : null,
                        a.getModality() != null ? a.getModality() : "ONLINE",
                        a.getPaymentMethod() != null ? a.getPaymentMethod() : "STRIPE",
                        a.getTaxRate(), a.getTaxAmount(), a.getTotalAmount(), a.getTaxExempt()));
            }
        }
        result.sort(Comparator.comparing(ClinicBillingDto::startTime).reversed());
        return result;
    }

    @Transactional
    public InvitationDto sendInvitation(String companyEmail, String targetEmail) {
        var company = getCompany(companyEmail);
        String normalizedEmail = targetEmail.trim().toLowerCase();

        // Check if already a member
        boolean alreadyMember = userRepository.findByCompanyId(company.getId()).stream()
            .anyMatch(u -> normalizedEmail.equals(u.getEmail()) && RoleConstants.PSYCHOLOGIST.equals(u.getRole()));
        if (alreadyMember) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este psicologo ya es miembro de tu clinica");
        }

        // Cancel any existing pending invite for same email
        clinicInvitationRepository.findByCompanyIdAndEmailAndStatus(company.getId(), normalizedEmail, "PENDING")
            .ifPresent(existing -> { existing.setStatus("CANCELLED"); clinicInvitationRepository.save(existing); });

        ClinicInvitationEntity inv = new ClinicInvitationEntity();
        inv.setCompanyId(company.getId());
        inv.setEmail(normalizedEmail);
        inv.setToken(UUID.randomUUID().toString());
        inv.setStatus("PENDING");
        inv.setExpiresAt(Instant.now().plusSeconds(7L * 24 * 3600));
        clinicInvitationRepository.save(inv);

        String inviteUrl = baseUrl + "/register?inviteToken=" + inv.getToken() + "&role=PSYCHOLOGIST";
        emailService.sendClinicInvitationEmail(normalizedEmail, company.getName(), inviteUrl);

        return new InvitationDto(inv.getId(), inv.getEmail(), inv.getStatus(),
            inv.getCreatedAt().toString(), inv.getExpiresAt().toString());
    }

    @Transactional(readOnly = true)
    public List<InvitationDto> listInvitations(String companyEmail) {
        var company = getCompany(companyEmail);
        return clinicInvitationRepository.findByCompanyIdOrderByCreatedAtDesc(company.getId()).stream()
            .map(inv -> new InvitationDto(inv.getId(), inv.getEmail(), inv.getStatus(),
                inv.getCreatedAt().toString(), inv.getExpiresAt().toString()))
            .collect(Collectors.toList());
    }

    @Transactional
    public void cancelInvitation(String companyEmail, Long invitationId) {
        var company = getCompany(companyEmail);
        var inv = clinicInvitationRepository.findById(invitationId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitacion no encontrada"));
        if (!company.getId().equals(inv.getCompanyId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
        }
        inv.setStatus("CANCELLED");
        clinicInvitationRepository.save(inv);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, String> getInviteInfo(String token) {
        var inv = clinicInvitationRepository.findByToken(token)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitacion no encontrada"));
        if (!"PENDING".equals(inv.getStatus()) || inv.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Invitacion expirada o invalida");
        }
        var company = companyRepository.findById(inv.getCompanyId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empresa no encontrada"));
        return java.util.Map.of("companyName", company.getName(), "email", inv.getEmail(), "companyId", String.valueOf(company.getId()));
    }

    // -------------------------------------------------------------------------
    // Stats
    // -------------------------------------------------------------------------
    public record PsychStatDto(Long id, String name, long count, BigDecimal revenue) {}
    public record MonthlyTrendDto(String month, long appointments, BigDecimal revenue) {}
    public record StatsDto(int totalPsychologists, long totalPatients, long appointmentsThisMonth,
                            BigDecimal revenueThisMonth, BigDecimal revenuePrevMonth, double occupancyRate,
                            List<PsychStatDto> appointmentsByPsychologist, List<MonthlyTrendDto> monthlyTrend) {}

    @Transactional(readOnly = true)
    public StatsDto getStats(String email) {
        var company = getCompany(email);
        List<UserEntity> psychs = userRepository.findByCompanyId(company.getId()).stream()
                .filter(u -> RoleConstants.PSYCHOLOGIST.equals(u.getRole())).collect(Collectors.toList());

        Set<Long> patientIds = new java.util.HashSet<>();
        for (UserEntity psych : psychs) {
            userPsychologistRepository.findByPsychologist_Id(psych.getId())
                    .forEach(rel -> patientIds.add(rel.getUser().getId()));
        }

        Instant now = Instant.now();
        java.time.YearMonth thisYM = java.time.YearMonth.now();
        Instant startThis = thisYM.atDay(1).atStartOfDay(com.alvaro.psicoapp.config.AppTimezone.APP_ZONE).toInstant();
        Instant endThis   = thisYM.plusMonths(1).atDay(1).atStartOfDay(com.alvaro.psicoapp.config.AppTimezone.APP_ZONE).toInstant();
        Instant startPrev = thisYM.minusMonths(1).atDay(1).atStartOfDay(com.alvaro.psicoapp.config.AppTimezone.APP_ZONE).toInstant();

        long totalThisMonth = 0;
        BigDecimal revThis = BigDecimal.ZERO, revPrev = BigDecimal.ZERO;
        List<PsychStatDto> psychStats = new ArrayList<>();

        for (UserEntity psych : psychs) {
            List<AppointmentEntity> all = appointmentRepository
                    .findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(
                            psych.getId(), Instant.ofEpochMilli(0), now.plusSeconds(365L * 24 * 3600));
            long cnt = all.stream().filter(a -> !isFreeOrCancelled(a))
                    .filter(a -> inRange(a, startThis, endThis)).count();
            BigDecimal rev = all.stream().filter(a -> !isFreeOrCancelled(a))
                    .filter(a -> inRange(a, startThis, endThis)).filter(a -> a.getPrice() != null)
                    .map(AppointmentEntity::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal rp = all.stream().filter(a -> !isFreeOrCancelled(a))
                    .filter(a -> inRange(a, startPrev, startThis)).filter(a -> a.getPrice() != null)
                    .map(AppointmentEntity::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add);
            totalThisMonth += cnt;
            revThis = revThis.add(rev);
            revPrev = revPrev.add(rp);
            psychStats.add(new PsychStatDto(psych.getId(), psych.getName(), cnt, rev));
        }

        List<MonthlyTrendDto> trend = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            java.time.YearMonth ym = thisYM.minusMonths(i);
            Instant s = ym.atDay(1).atStartOfDay(com.alvaro.psicoapp.config.AppTimezone.APP_ZONE).toInstant();
            Instant e = ym.plusMonths(1).atDay(1).atStartOfDay(com.alvaro.psicoapp.config.AppTimezone.APP_ZONE).toInstant();
            long c = 0; BigDecimal rv = BigDecimal.ZERO;
            for (UserEntity psych : psychs) {
                List<AppointmentEntity> ap = appointmentRepository
                        .findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(psych.getId(), s, e);
                c  += ap.stream().filter(a -> !isFreeOrCancelled(a)).count();
                rv  = rv.add(ap.stream().filter(a -> !isFreeOrCancelled(a) && a.getPrice() != null)
                        .map(AppointmentEntity::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add));
            }
            trend.add(new MonthlyTrendDto(ym.toString(), c, rv));
        }

        double occ = psychs.isEmpty() ? 0.0 : Math.min(1.0, totalThisMonth / (psychs.size() * 80.0));
        return new StatsDto(psychs.size(), (long) patientIds.size(), totalThisMonth,
                revThis, revPrev, occ, psychStats, trend);
    }

    // -------------------------------------------------------------------------
    // Audit logs
    // -------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<com.alvaro.psicoapp.domain.AuditLogEntity> getAuditLogs(
            String email, Instant from, Instant to, org.springframework.data.domain.Pageable pageable) {
        var company = getCompany(email);
        List<Long> psychIds = userRepository.findByCompanyId(company.getId()).stream()
                .filter(u -> RoleConstants.PSYCHOLOGIST.equals(u.getRole()))
                .map(UserEntity::getId)
                .collect(Collectors.toList());
        if (psychIds.isEmpty()) {
            return org.springframework.data.domain.Page.empty(pageable);
        }
        return auditService.getAuditLogsByPerformers(psychIds, from, to, pageable);
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

    private static boolean isFreeOrCancelled(AppointmentEntity a) {
        return a.getStatus() == AppointmentStatusEnum.FREE || a.getStatus() == AppointmentStatusEnum.CANCELLED;
    }
    private static boolean inRange(AppointmentEntity a, Instant from, Instant to) {
        return a.getStartTime() != null && !a.getStartTime().isBefore(from) && a.getStartTime().isBefore(to);
    }

    // -------------------------------------------------------------------------
    // Session notes
    // -------------------------------------------------------------------------
    public record UpdateNotesRequest(String clinicNotes) {}

    @Transactional
    public ClinicAppointmentDto updateAppointmentNotes(String email, Long appointmentId, String clinicNotes) {
        var company = getCompany(email);
        AppointmentEntity appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));
        assertPsychBelongsToCompany(appt.getPsychologist(), company.getId());
        appt.setClinicNotes(clinicNotes);
        appointmentRepository.save(appt);
        return toAppointmentDto(appt, appt.getPsychologist());
    }

    // -------------------------------------------------------------------------
    // Patient documents
    // -------------------------------------------------------------------------
    public record DocumentDto(Long id, String originalName, String fileName, Long fileSize, String uploadedAt) {}

    @Transactional(readOnly = true)
    public List<DocumentDto> listDocuments(String email, Long patientId) {
        var company = getCompany(email);
        return clinicPatientDocumentRepository
                .findByCompanyIdAndPatientIdOrderByUploadedAtDesc(company.getId(), patientId).stream()
                .map(d -> new DocumentDto(d.getId(), d.getOriginalName(), d.getFileName(),
                        d.getFileSize(), d.getUploadedAt().toString()))
                .collect(Collectors.toList());
    }

    private static final Set<String> ALLOWED_FILE_EXTENSIONS = Set.of(
            "pdf", "doc", "docx", "jpg", "jpeg", "png"
    );
    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024; // 10MB

    private void validateUploadedFile(org.springframework.web.multipart.MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo esta vacio");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El archivo excede el tamano maximo permitido (10MB)");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.contains(".")) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
            if (!ALLOWED_FILE_EXTENSIONS.contains(ext)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Tipo de archivo no permitido. Extensiones validas: " + String.join(", ", ALLOWED_FILE_EXTENSIONS));
            }
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo debe tener una extension valida");
        }
    }

    @Transactional
    public DocumentDto uploadDocument(String email, Long patientId,
                                       org.springframework.web.multipart.MultipartFile file) {
        var company = getCompany(email);
        userRepository.findById(patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));
        validateUploadedFile(file);
        try {
            java.io.File dir = new java.io.File("uploads/clinic-docs");
            if (!dir.exists()) dir.mkdirs();
            String orig = file.getOriginalFilename();
            String ext = (orig != null && orig.contains(".")) ? orig.substring(orig.lastIndexOf('.')) : "";
            String stored = UUID.randomUUID() + ext;
            file.transferTo(new java.io.File(dir, stored));
            ClinicPatientDocumentEntity doc = new ClinicPatientDocumentEntity();
            doc.setCompanyId(company.getId());
            doc.setPatientId(patientId);
            doc.setFileName("clinic-docs/" + stored);
            doc.setOriginalName(orig != null ? orig : stored);
            doc.setFileSize(file.getSize());
            doc.setUploadedByEmail(email);
            clinicPatientDocumentRepository.save(doc);
            return new DocumentDto(doc.getId(), doc.getOriginalName(), doc.getFileName(),
                    doc.getFileSize(), doc.getUploadedAt().toString());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al subir el archivo");
        }
    }

    @Transactional
    public void deleteDocument(String email, Long documentId) {
        var company = getCompany(email);
        var doc = clinicPatientDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento no encontrado"));
        if (!company.getId().equals(doc.getCompanyId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
        try { new java.io.File("uploads/" + doc.getFileName()).delete(); } catch (Exception ignored) {}
        clinicPatientDocumentRepository.delete(doc);
    }

    // -------------------------------------------------------------------------
    // Payment link (Feature E)
    // -------------------------------------------------------------------------
    @Transactional
    public Map<String, String> createPaymentLink(String email, Long appointmentId) {
        var company = getCompany(email);
        AppointmentEntity appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));
        assertPsychBelongsToCompany(appt.getPsychologist(), company.getId());
        if (appt.getPrice() == null || appt.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cita no tiene precio definido");
        }
        String patientEmail = appt.getUser() != null ? appt.getUser().getEmail() : email;
        try {
            return stripeService.createAppointmentCheckoutSession(appointmentId, patientEmail);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Clinic rooms (despachos)
    // -------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<ClinicRoomDto> getRooms(String email) {
        var company = getCompany(email);
        return clinicRoomRepository.findByCompanyIdOrderByNameAsc(company.getId()).stream()
                .map(r -> new ClinicRoomDto(r.getId(), r.getName(), r.getColor(),
                        r.getAssignedPsychologistId(), r.getActive()))
                .collect(Collectors.toList());
    }

    @Transactional
    public ClinicRoomDto createRoom(String email, CreateRoomRequest req) {
        var company = getCompany(email);
        if (req.name() == null || req.name().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del despacho es obligatorio");
        ClinicRoomEntity room = new ClinicRoomEntity();
        room.setCompanyId(company.getId());
        room.setName(req.name().trim());
        room.setColor(req.color() != null ? req.color() : "#5a9270");
        room.setAssignedPsychologistId(req.assignedPsychologistId());
        room.setActive(true);
        clinicRoomRepository.save(room);
        return new ClinicRoomDto(room.getId(), room.getName(), room.getColor(),
                room.getAssignedPsychologistId(), room.getActive());
    }

    @Transactional
    public ClinicRoomDto updateRoom(String email, Long roomId, UpdateRoomRequest req) {
        var company = getCompany(email);
        ClinicRoomEntity room = clinicRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Despacho no encontrado"));
        if (!company.getId().equals(room.getCompanyId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
        if (req.name() != null && !req.name().isBlank()) room.setName(req.name().trim());
        if (req.color() != null) room.setColor(req.color());
        if (req.assignedPsychologistId() != null) room.setAssignedPsychologistId(req.assignedPsychologistId());
        else room.setAssignedPsychologistId(null); // allow clearing
        if (req.active() != null) room.setActive(req.active());
        clinicRoomRepository.save(room);
        return new ClinicRoomDto(room.getId(), room.getName(), room.getColor(),
                room.getAssignedPsychologistId(), room.getActive());
    }

    @Transactional
    public void deleteRoom(String email, Long roomId) {
        var company = getCompany(email);
        ClinicRoomEntity room = clinicRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Despacho no encontrado"));
        if (!company.getId().equals(room.getCompanyId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
        clinicRoomRepository.delete(room);
    }

    // -------------------------------------------------------------------------
    // Psychologist schedule (Feature G)
    // -------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<ClinicAppointmentDto> getPsychologistSchedule(String email, Long psychologistId) {
        var company = getCompany(email);
        UserEntity psych = userRepository.findById(psychologistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Psicólogo no encontrado"));
        assertPsychBelongsToCompany(psych, company.getId());
        Instant now = Instant.now();
        return appointmentRepository
                .findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(
                        psychologistId, now, now.plusSeconds(30L * 24 * 3600))
                .stream()
                .map(a -> toAppointmentDto(a, psych))
                .collect(Collectors.toList());
    }

    // -------------------------------------------------------------------------
    // Psychologist absences (Feature 11)
    // -------------------------------------------------------------------------
    public record ClinicAbsenceDto(Long id, String startTime, String endTime, String reason, String createdAt) {}

    @Transactional(readOnly = true)
    public List<ClinicAbsenceDto> getPsychologistAbsences(String email, Long psychologistId) {
        var company = getCompany(email);
        UserEntity psych = userRepository.findById(psychologistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Psicólogo no encontrado"));
        assertPsychBelongsToCompany(psych, company.getId());
        return psychAbsenceRepository.findByPsychologist_IdAndEndTimeAfterOrderByStartTimeAsc(
                        psychologistId, Instant.now())
                .stream()
                .map(a -> new ClinicAbsenceDto(a.getId(),
                        a.getStartTime().toString(), a.getEndTime().toString(),
                        a.getReason(), a.getCreatedAt().toString()))
                .collect(Collectors.toList());
    }

    // -------------------------------------------------------------------------
    // Multi-admin management (Feature 8)
    // -------------------------------------------------------------------------
    private ClinicAdminDto toAdminDto(ClinicAdminEntity a) {
        UserEntity u = a.getUser();
        return new ClinicAdminDto(a.getId(), u.getId(), u.getName(), u.getEmail(), u.getAvatarUrl(),
                a.getRole(), a.getStatus(), a.getInvitedByEmail(),
                a.getInvitedAt() != null ? a.getInvitedAt().toString() : null,
                a.getAcceptedAt() != null ? a.getAcceptedAt().toString() : null);
    }

    @Transactional(readOnly = true)
    public List<ClinicAdminDto> getAdmins(String email) {
        var company = getCompany(email);
        return clinicAdminRepository.findByCompanyIdOrderByInvitedAtDesc(company.getId()).stream()
                .map(this::toAdminDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClinicAdminDto inviteAdmin(String email, InviteAdminRequest req) {
        var company = getCompany(email);
        // Only OWNER can invite
        assertCallerIsOwner(company.getId(), email);

        String targetEmail = req.email().trim().toLowerCase();
        String role = req.role() != null ? req.role().toUpperCase() : "ADMIN";
        if (!Set.of("ADMIN", "VIEWER").contains(role)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rol invalido. Usa ADMIN o VIEWER");
        }

        UserEntity targetUser = userRepository.findByEmail(targetEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No se encontro un usuario con ese email. Debe estar registrado en la plataforma"));

        // Check if already an admin
        clinicAdminRepository.findByCompanyIdAndUserId(company.getId(), targetUser.getId())
                .ifPresent(existing -> {
                    if ("ACTIVE".equals(existing.getStatus()) || "INVITED".equals(existing.getStatus())) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Este usuario ya es administrador o tiene una invitacion pendiente");
                    }
                });

        ClinicAdminEntity admin = new ClinicAdminEntity();
        admin.setCompany(company);
        admin.setUser(targetUser);
        admin.setRole(role);
        admin.setInvitedByEmail(email);
        admin.setStatus("INVITED");
        clinicAdminRepository.save(admin);

        logger.info("Admin invitation sent: {} invited {} as {} to company {}", email, targetEmail, role, company.getId());
        return toAdminDto(admin);
    }

    @Transactional
    public ClinicAdminDto acceptAdminInvitation(Long userId, Long companyId) {
        ClinicAdminEntity admin = clinicAdminRepository.findByCompanyIdAndUserId(companyId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitacion no encontrada"));
        if (!"INVITED".equals(admin.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta invitacion ya fue procesada");
        }
        admin.setStatus("ACTIVE");
        admin.setAcceptedAt(Instant.now());
        clinicAdminRepository.save(admin);
        logger.info("Admin invitation accepted: userId={} companyId={}", userId, companyId);
        return toAdminDto(admin);
    }

    @Transactional
    public ClinicAdminDto updateAdminRole(String email, Long adminId, String newRole) {
        var company = getCompany(email);
        assertCallerIsOwner(company.getId(), email);

        String role = newRole.toUpperCase();
        if (!Set.of("ADMIN", "VIEWER").contains(role)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rol invalido. Usa ADMIN o VIEWER");
        }

        ClinicAdminEntity admin = clinicAdminRepository.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Administrador no encontrado"));
        if (!company.getId().equals(admin.getCompany().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
        }
        if ("OWNER".equals(admin.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede cambiar el rol del propietario");
        }
        admin.setRole(role);
        clinicAdminRepository.save(admin);
        return toAdminDto(admin);
    }

    @Transactional
    public void removeAdmin(String email, Long adminId) {
        var company = getCompany(email);
        assertCallerIsOwner(company.getId(), email);

        ClinicAdminEntity admin = clinicAdminRepository.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Administrador no encontrado"));
        if (!company.getId().equals(admin.getCompany().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
        }
        if ("OWNER".equals(admin.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede eliminar al propietario");
        }
        admin.setStatus("DEACTIVATED");
        clinicAdminRepository.save(admin);
    }

    private void assertCallerIsOwner(Long companyId, String callerEmail) {
        // The company email itself is always owner
        var company = companyRepository.findByEmail(callerEmail).orElse(null);
        if (company != null && company.getId().equals(companyId)) return;
        // Otherwise check clinic_admins table for OWNER role
        var callerUser = userRepository.findByEmail(callerEmail).orElse(null);
        if (callerUser != null) {
            var adminEntry = clinicAdminRepository.findByCompanyIdAndUserId(companyId, callerUser.getId());
            if (adminEntry.isPresent() && "OWNER".equals(adminEntry.get().getRole())) return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el propietario puede realizar esta accion");
    }

}