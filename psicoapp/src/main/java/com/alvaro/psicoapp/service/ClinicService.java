package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ClinicService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserPsychologistRepository userPsychologistRepository;
    private final ClinicPatientProfileRepository clinicPatientProfileRepository;

    public ClinicService(CompanyRepository companyRepository,
                         UserRepository userRepository,
                         AppointmentRepository appointmentRepository,
                         UserPsychologistRepository userPsychologistRepository,
                         ClinicPatientProfileRepository clinicPatientProfileRepository) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.clinicPatientProfileRepository = clinicPatientProfileRepository;
    }

    // --- DTOs ---
    public record ClinicMeDto(Long id, String name, String email, String referralCode) {}
    public record ClinicPsychologistDto(Long id, String name, String email, String avatarUrl) {}
    public record ClinicAppointmentDto(Long id, Long psychologistId, String psychologistName,
                                        String psychologistAvatarUrl, Long patientId, String patientName,
                                        String startTime, String endTime, String status, String service,
                                        BigDecimal price, String paymentStatus, String notes, String clinicNotes) {}
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
                                    String service, BigDecimal price, String paymentStatus) {}
    public record CreateAppointmentRequest(Long psychologistId, Long patientId, String patientName,
                                            String startTime, String endTime, String service,
                                            BigDecimal price, String notes, String clinicNotes,
                                            String paymentStatus) {}
    public record UpdateAppointmentRequest(Long patientId, String patientName, String startTime, String endTime,
                                            String service, BigDecimal price, String notes, String clinicNotes,
                                            String paymentStatus) {}
    public record UpdatePatientRequest(String notes, String allergies, String medication, String medicalHistory,
                                        Boolean consentSigned, String patientType, String status, String phone) {}

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
        return new ClinicAppointmentDto(
                a.getId(), psych.getId(), psych.getName(), psych.getAvatarUrl(),
                patientId, patientName,
                a.getStartTime() != null ? a.getStartTime().toString() : null,
                a.getEndTime() != null ? a.getEndTime().toString() : null,
                a.getStatus(), a.getService(), a.getPrice(), a.getPaymentStatus(),
                a.getNotes(), a.getClinicNotes());
    }

    @Transactional(readOnly = true)
    public ClinicMeDto getMe(String email) {
        var company = getCompany(email);
        return new ClinicMeDto(company.getId(), company.getName(), company.getEmail(), company.getReferralCode());
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
    public ClinicAppointmentDto createAppointment(String email, CreateAppointmentRequest req) {
        var company = getCompany(email);
        UserEntity psych = userRepository.findById(req.psychologistId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Psicólogo no encontrado"));
        assertPsychBelongsToCompany(psych, company.getId());

        UserEntity patient = null;
        if (req.patientId() != null) {
            patient = userRepository.findById(req.patientId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));
        }

        AppointmentEntity appt = new AppointmentEntity();
        appt.setPsychologist(psych);
        appt.setUser(patient);
        appt.setStartTime(Instant.parse(req.startTime()));
        appt.setEndTime(Instant.parse(req.endTime()));
        appt.setStatus("CONFIRMED");
        appt.setService(req.service());
        appt.setPrice(req.price());
        appt.setNotes(req.notes());
        appt.setClinicNotes(req.clinicNotes());
        appt.setPaymentStatus(req.paymentStatus() != null ? req.paymentStatus() : "PENDING");
        appt.setConfirmedAt(Instant.now());
        appointmentRepository.save(appt);

        return toAppointmentDto(appt, psych);
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
        if (req.paymentStatus() != null) appt.setPaymentStatus(req.paymentStatus());
        if (req.patientId() != null) {
            UserEntity patient = userRepository.findById(req.patientId()).orElse(null);
            appt.setUser(patient);
        }
        appointmentRepository.save(appt);

        return toAppointmentDto(appt, appt.getPsychologist());
    }

    @Transactional
    public void cancelAppointment(String email, Long appointmentId) {
        var company = getCompany(email);
        AppointmentEntity appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));
        assertPsychBelongsToCompany(appt.getPsychologist(), company.getId());
        appt.setStatus("CANCELLED");
        appointmentRepository.save(appt);
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
                if ("FREE".equals(a.getStatus())) continue;
                String patientName = a.getUser() != null ? a.getUser().getName() : null;
                Long pid = a.getUser() != null ? a.getUser().getId() : null;
                result.add(new ClinicBillingDto(
                        a.getId(), a.getStartTime().toString(), a.getEndTime().toString(),
                        psych.getId(), psych.getName(), pid, patientName,
                        a.getService(), a.getPrice(), a.getPaymentStatus()));
            }
        }
        result.sort(Comparator.comparing(ClinicBillingDto::startTime).reversed());
        return result;
    }
}
