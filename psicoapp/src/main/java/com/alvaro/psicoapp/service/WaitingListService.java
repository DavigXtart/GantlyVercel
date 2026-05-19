package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.AppointmentEntity;
import com.alvaro.psicoapp.domain.ClinicServiceEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.domain.WaitingListEntity;
import com.alvaro.psicoapp.repository.AppointmentRepository;
import com.alvaro.psicoapp.repository.ClinicServiceRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.repository.WaitingListRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WaitingListService {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(WaitingListService.class);

    private final WaitingListRepository waitingListRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final ClinicServiceRepository clinicServiceRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    public WaitingListService(WaitingListRepository waitingListRepository,
                              AppointmentRepository appointmentRepository,
                              UserRepository userRepository,
                              ClinicServiceRepository clinicServiceRepository,
                              EmailService emailService,
                              NotificationService notificationService) {
        this.waitingListRepository = waitingListRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.clinicServiceRepository = clinicServiceRepository;
        this.emailService = emailService;
        this.notificationService = notificationService;
    }

    // --- DTOs ---
    public record WaitingListEntryDto(Long id, Long companyId, Long patientId, String patientName,
                                       String patientEmail, String patientPhone,
                                       Long requestedServiceId, String requestedServiceName,
                                       Long psychologistPreferenceId, String psychologistPreferenceName,
                                       String priority, String notes, String status,
                                       String createdAt, String updatedAt, String contactedAt,
                                       Long scheduledAppointmentId) {}

    public record CreateWaitingListRequest(String patientName, String patientEmail, String patientPhone,
                                            Long patientId, Long requestedServiceId,
                                            Long psychologistPreferenceId, String priority, String notes) {}

    public record UpdateWaitingListRequest(String status, String priority, String notes,
                                            Long psychologistPreferenceId, Long requestedServiceId) {}

    @Transactional
    public WaitingListEntryDto addToWaitingList(Long companyId, CreateWaitingListRequest req) {
        WaitingListEntity entry = new WaitingListEntity();
        entry.setCompanyId(companyId);
        entry.setPatientName(req.patientName());
        entry.setPatientEmail(req.patientEmail());
        entry.setPatientPhone(req.patientPhone());
        entry.setPriority(req.priority() != null ? req.priority() : "NORMAL");

        if (req.patientId() != null) {
            UserEntity patient = userRepository.findById(req.patientId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));
            entry.setPatient(patient);
        }

        if (req.requestedServiceId() != null) {
            ClinicServiceEntity svc = clinicServiceRepository.findById(req.requestedServiceId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Servicio no encontrado"));
            entry.setRequestedService(svc);
        }

        if (req.psychologistPreferenceId() != null) {
            UserEntity psych = userRepository.findById(req.psychologistPreferenceId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Psicólogo no encontrado"));
            entry.setPsychologistPreference(psych);
        }

        if (req.notes() != null) {
            entry.setNotes(req.notes());
        }

        WaitingListEntity saved = waitingListRepository.save(entry);
        logger.info("Added to waiting list: companyId={}, patientName={}", companyId, req.patientName());
        return toDto(saved);
    }

    @Transactional
    public WaitingListEntryDto updateEntry(Long companyId, Long id, UpdateWaitingListRequest req) {
        WaitingListEntity entry = waitingListRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrada no encontrada"));

        if (req.status() != null) entry.setStatus(req.status());
        if (req.priority() != null) entry.setPriority(req.priority());
        if (req.notes() != null) entry.setNotes(req.notes());

        if (req.psychologistPreferenceId() != null) {
            UserEntity psych = userRepository.findById(req.psychologistPreferenceId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Psicólogo no encontrado"));
            entry.setPsychologistPreference(psych);
        }

        if (req.requestedServiceId() != null) {
            ClinicServiceEntity svc = clinicServiceRepository.findById(req.requestedServiceId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Servicio no encontrado"));
            entry.setRequestedService(svc);
        }

        entry.setUpdatedAt(Instant.now());
        WaitingListEntity saved = waitingListRepository.save(entry);
        return toDto(saved);
    }

    @Transactional
    public void removeEntry(Long companyId, Long id) {
        WaitingListEntity entry = waitingListRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrada no encontrada"));
        waitingListRepository.delete(entry);
    }

    public List<WaitingListEntryDto> getEntries(Long companyId, String statusFilter) {
        List<WaitingListEntity> entries;
        if (statusFilter != null && !statusFilter.isBlank()) {
            entries = waitingListRepository.findByCompanyIdAndStatusOrderByCreatedAtAsc(companyId, statusFilter);
        } else {
            entries = waitingListRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);
        }
        return entries.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public WaitingListEntryDto notifyPatient(Long companyId, Long id, String clinicName) {
        WaitingListEntity entry = waitingListRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrada no encontrada"));

        if (entry.getPatientEmail() != null && !entry.getPatientEmail().isBlank()) {
            try {
                emailService.sendGenericEmail(
                        entry.getPatientEmail(),
                        "Disponibilidad en " + clinicName,
                        "Hola " + entry.getPatientName() + ",\n\n" +
                        "Te informamos de que hay disponibilidad en " + clinicName + ". " +
                        "Por favor, contacta con nosotros para confirmar tu cita.\n\n" +
                        "Un saludo,\n" + clinicName
                );
            } catch (Exception e) {
                logger.warn("Failed to send waiting list notification email to {}: {}", entry.getPatientEmail(), e.getMessage());
            }
        }

        // Also send in-app notification if patient is a registered user
        if (entry.getPatient() != null) {
            notificationService.createNotification(
                    entry.getPatient().getId(),
                    "WAITING_LIST",
                    "Disponibilidad en tu clínica",
                    "Hay disponibilidad para tu cita. Contacta con la clínica para confirmar."
            );
        }

        entry.setStatus("CONTACTED");
        entry.setContactedAt(Instant.now());
        entry.setUpdatedAt(Instant.now());
        WaitingListEntity saved = waitingListRepository.save(entry);
        logger.info("Waiting list patient notified: id={}, email={}", id, entry.getPatientEmail());
        return toDto(saved);
    }

    @Transactional
    public WaitingListEntryDto scheduleFromWaitingList(Long companyId, Long id, Long appointmentId) {
        WaitingListEntity entry = waitingListRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrada no encontrada"));

        AppointmentEntity appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));

        entry.setScheduledAppointment(appointment);
        entry.setStatus("SCHEDULED");
        entry.setUpdatedAt(Instant.now());
        WaitingListEntity saved = waitingListRepository.save(entry);
        logger.info("Waiting list entry scheduled: id={}, appointmentId={}", id, appointmentId);
        return toDto(saved);
    }

    private WaitingListEntryDto toDto(WaitingListEntity e) {
        return new WaitingListEntryDto(
                e.getId(),
                e.getCompanyId(),
                e.getPatient() != null ? e.getPatient().getId() : null,
                e.getPatientName(),
                e.getPatientEmail(),
                e.getPatientPhone(),
                e.getRequestedService() != null ? e.getRequestedService().getId() : null,
                e.getRequestedService() != null ? e.getRequestedService().getName() : null,
                e.getPsychologistPreference() != null ? e.getPsychologistPreference().getId() : null,
                e.getPsychologistPreference() != null ? e.getPsychologistPreference().getName() : null,
                e.getPriority(),
                e.getNotes(),
                e.getStatus(),
                e.getCreatedAt() != null ? e.getCreatedAt().toString() : null,
                e.getUpdatedAt() != null ? e.getUpdatedAt().toString() : null,
                e.getContactedAt() != null ? e.getContactedAt().toString() : null,
                e.getScheduledAppointment() != null ? e.getScheduledAppointment().getId() : null
        );
    }
}
