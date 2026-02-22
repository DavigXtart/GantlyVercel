package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.dto.ConsentDtos;
import com.alvaro.psicoapp.repository.ConsentDocumentTypeRepository;
import com.alvaro.psicoapp.repository.ConsentRequestRepository;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import jakarta.annotation.PostConstruct;
import java.util.*;

@Service
public class ConsentService {
    private final ConsentDocumentTypeRepository documentTypeRepository;
    private final ConsentRequestRepository consentRequestRepository;
    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;
    private final AuditService auditService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    public ConsentService(
            ConsentDocumentTypeRepository documentTypeRepository,
            ConsentRequestRepository consentRequestRepository,
            UserRepository userRepository,
            UserPsychologistRepository userPsychologistRepository,
            AuditService auditService
    ) {
        this.documentTypeRepository = documentTypeRepository;
        this.consentRequestRepository = consentRequestRepository;
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.auditService = auditService;
    }

    @PostConstruct
    @Transactional
    public void ensureDefaultDocType() {

        if (documentTypeRepository.count() > 0) return;
        ConsentDocumentTypeEntity t = new ConsentDocumentTypeEntity();
        t.setCode("MINOR_CONSENT_PLACEHOLDER");
        t.setTitle("Consentimiento informado (menores) - borrador");
        t.setTemplate("""
                CONSENTIMIENTO INFORMADO (BORRADOR)

                Psicólogo/a: {{PSYCHOLOGIST_NAME}} ({{PSYCHOLOGIST_EMAIL}})
                Paciente: {{PATIENT_NAME}} ({{PATIENT_EMAIL}})
                Lugar: {{PLACE}}
                Fecha: {{DATE}}
                Hora: {{TIME}}

                [Texto del consentimiento pendiente de redacción]
                """);
        t.setActive(true);
        documentTypeRepository.save(t);
    }

    @Transactional(readOnly = true)
    public List<ConsentDtos.DocumentTypeDto> listActiveDocumentTypes() {
        return documentTypeRepository.findByActiveTrueOrderByTitleAsc()
                .stream()
                .map(t -> new ConsentDtos.DocumentTypeDto(t.getId(), t.getCode(), t.getTitle(), t.getActive()))
                .toList();
    }

    @Transactional
    public ConsentDtos.ConsentRequestDto createAndSend(UserEntity psychologist, ConsentDtos.CreateConsentRequest req) {
        requirePsychologist(psychologist);
        if (req == null || req.userId() == null || req.documentTypeId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Faltan datos para enviar el consentimiento");
        }

        Long patientId = req.userId();

        var relOpt = userPsychologistRepository.findByUserId(patientId);
        if (relOpt.isEmpty() || relOpt.get().getPsychologist() == null || !Objects.equals(relOpt.get().getPsychologist().getId(), psychologist.getId())) {
            auditService.logUnauthorizedAccess(psychologist.getId(), psychologist.getRole(), patientId, "CONSENT_SEND", "FORBIDDEN");
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este usuario no es tu paciente");
        }

        UserEntity patient = userRepository.findById(patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));

        if (!isMinor(patient)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El paciente no es menor de edad");
        }

        ConsentDocumentTypeEntity docType = documentTypeRepository.findById(req.documentTypeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tipo de documento no encontrado"));
        if (docType.getActive() == null || !docType.getActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El tipo de documento no está activo");
        }

        ConsentRequestEntity consent = new ConsentRequestEntity();
        consent.setPsychologist(psychologist);
        consent.setUser(patient);
        consent.setDocumentType(docType);
        consent.setPlace(safeTrim(req.place(), 200));
        consent.setStatus(ConsentRequestStatus.SENT);
        consent.setSentAt(Instant.now());

        String rendered = renderTemplate(docType.getTemplate(), psychologist, patient, consent);
        consent.setRenderedContent(rendered);

        ConsentRequestEntity saved = consentRequestRepository.save(consent);
        auditService.logPatientDataAccess(psychologist.getId(), patientId, "CONSENT_REQUEST", "CREATE/SEND");
        return toDto(saved, true);
    }

    @Transactional(readOnly = true)
    public List<ConsentDtos.ConsentRequestDto> myPendingConsents(UserEntity user) {
        if (user == null || user.getId() == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        var list = consentRequestRepository.findByUser_IdAndStatusInOrderByCreatedAtDesc(
                user.getId(), List.of(ConsentRequestStatus.SENT, ConsentRequestStatus.DRAFT));

        return list.stream().map(c -> toDto(c, true)).toList();
    }

    @Transactional
    public ConsentDtos.ConsentRequestDto sign(UserEntity user, Long consentId, ConsentDtos.SignConsentRequest req) {
        if (user == null || user.getId() == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        if (consentId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "consentId es requerido");
        ConsentRequestEntity consent = consentRequestRepository.findById(consentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consentimiento no encontrado"));

        if (consent.getUser() == null || consent.getUser().getId() == null || !Objects.equals(consent.getUser().getId(), user.getId())) {
            auditService.logUnauthorizedAccess(user.getId(), user.getRole(), consent.getUser() != null ? consent.getUser().getId() : null, "CONSENT_SIGN", "FORBIDDEN");
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
        }
        if (consent.getStatus() != ConsentRequestStatus.SENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este consentimiento no está pendiente de firma");
        }
        String signerName = safeTrim(req != null ? req.signerName() : null, 200);
        if (signerName == null || signerName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del firmante es obligatorio");
        }

        consent.setSignerName(signerName);
        consent.setSignedAt(Instant.now());
        consent.setStatus(ConsentRequestStatus.SIGNED);
        ConsentRequestEntity saved = consentRequestRepository.save(consent);
        auditService.logSelfDataAccess(user.getId(), "CONSENT_SIGN", "UPDATE");
        return toDto(saved, true);
    }

    @Transactional(readOnly = true)
    public Map<Long, ConsentDtos.ConsentStatusSummary> statusForPatients(UserEntity psychologist, Collection<Long> patientIds, Map<Long, Boolean> minorMap) {
        requirePsychologist(psychologist);
        if (patientIds == null || patientIds.isEmpty()) return Map.of();
        List<ConsentRequestEntity> all = consentRequestRepository.findByPsychologist_IdAndUser_IdInOrderByCreatedAtDesc(psychologist.getId(), patientIds);
        Map<Long, ConsentRequestEntity> latest = new HashMap<>();
        for (ConsentRequestEntity c : all) {
            Long uid = c.getUser() != null ? c.getUser().getId() : null;
            if (uid == null) continue;
            latest.putIfAbsent(uid, c);
        }
        Map<Long, ConsentDtos.ConsentStatusSummary> out = new HashMap<>();
        for (Long uid : patientIds) {
            boolean isMinor = minorMap.getOrDefault(uid, false);
            ConsentRequestEntity c = latest.get(uid);
            String status = c != null && c.getStatus() != null ? c.getStatus().name() : "NONE";
            Long cid = c != null ? c.getId() : null;
            out.put(uid, new ConsentDtos.ConsentStatusSummary(uid, isMinor, status, cid));
        }
        return out;
    }

    public boolean isMinor(UserEntity user) {
        if (user == null) return false;
        LocalDate birth = user.getBirthDate();
        if (birth != null) {
            long years = ChronoUnit.YEARS.between(birth, LocalDate.now());
            return years < 18;
        }
        Integer age = user.getAge();
        return age != null && age < 18;
    }

    private ConsentDtos.ConsentRequestDto toDto(ConsentRequestEntity c, boolean includeContent) {
        return new ConsentDtos.ConsentRequestDto(
                c.getId(),
                c.getUser() != null ? c.getUser().getId() : null,
                c.getPsychologist() != null ? c.getPsychologist().getId() : null,
                c.getDocumentType() != null ? c.getDocumentType().getId() : null,
                c.getDocumentType() != null ? c.getDocumentType().getTitle() : null,
                c.getStatus() != null ? c.getStatus().name() : null,
                c.getPlace(),
                c.getSentAt(),
                c.getSignedAt(),
                c.getSignerName(),
                includeContent ? c.getRenderedContent() : null
        );
    }

    private String renderTemplate(String template, UserEntity psychologist, UserEntity patient, ConsentRequestEntity consent) {
        String t = template != null ? template : "";
        ZoneId tz = ZoneId.systemDefault();
        Instant sentAt = consent.getSentAt() != null ? consent.getSentAt() : Instant.now();
        var dt = sentAt.atZone(tz);
        String date = dt.toLocalDate().format(DATE_FMT);
        String time = dt.toLocalTime().format(TIME_FMT);

        Map<String, String> vars = new HashMap<>();
        vars.put("PSYCHOLOGIST_NAME", nullSafe(psychologist.getName()));
        vars.put("PSYCHOLOGIST_EMAIL", nullSafe(psychologist.getEmail()));
        vars.put("PATIENT_NAME", nullSafe(patient.getName()));
        vars.put("PATIENT_EMAIL", nullSafe(patient.getEmail()));
        vars.put("PLACE", nullSafe(consent.getPlace()));
        vars.put("DATE", date);
        vars.put("TIME", time);

        String out = t;
        for (var e : vars.entrySet()) {
            out = out.replace("{{" + e.getKey() + "}}", e.getValue());
        }
        return out;
    }

    private static String safeTrim(String s, int max) {
        if (s == null) return null;
        String trimmed = s.trim();
        if (trimmed.length() <= max) return trimmed;
        return trimmed.substring(0, max);
    }

    private static String nullSafe(String s) {
        return s == null ? "" : s;
    }

    private void requirePsychologist(UserEntity user) {
        if (user == null || !RoleConstants.PSYCHOLOGIST.equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }
}
