package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.PsychologistProfileEntity;
import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.UserAnswerEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.PsychologistDtos;
import com.alvaro.psicoapp.repository.*;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;

@Service
public class PsychologistService {
    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final TestRepository testRepository;
    private final PsychologistProfileRepository psychologistProfileRepository;
    private final AppointmentRepository appointmentRepository;

    public PsychologistService(UserRepository userRepository, UserPsychologistRepository userPsychologistRepository,
                               UserAnswerRepository userAnswerRepository, TestRepository testRepository,
                               PsychologistProfileRepository psychologistProfileRepository,
                               AppointmentRepository appointmentRepository) {
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.userAnswerRepository = userAnswerRepository;
        this.testRepository = testRepository;
        this.psychologistProfileRepository = psychologistProfileRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "psychologistPatients", key = "#psychologist.email")
    public List<PsychologistDtos.PatientSummaryDto> getPatients(UserEntity psychologist) {
        requirePsychologist(psychologist);
        var rels = userPsychologistRepository.findByPsychologist_Id(psychologist.getId());
        Instant now = Instant.now();
        List<PsychologistDtos.PatientSummaryDto> out = new ArrayList<>();
        for (var r : rels) {
            var lastAppts = appointmentRepository.findLastCompletedAppointment(psychologist.getId(), r.getUser().getId(), now);
            Instant lastVisit = lastAppts.isEmpty() ? null : lastAppts.get(0).getEndTime();
            out.add(new PsychologistDtos.PatientSummaryDto(
                    r.getUser().getId(),
                    r.getUser().getName(),
                    r.getUser().getEmail(),
                    r.getUser().getAvatarUrl() != null ? r.getUser().getAvatarUrl() : "",
                    r.getUser().getGender(),
                    r.getUser().getAge(),
                    r.getStatus() != null ? r.getStatus() : "ACTIVE",
                    r.getAssignedAt(),
                    lastVisit
            ));
        }
        return out;
    }

    @Transactional(readOnly = true)
    public PsychologistDtos.PatientDetailDto getPatientDetails(UserEntity psychologist, Long patientId) {
        requirePsychologist(psychologist);
        requirePatientOf(psychologist.getId(), patientId);

        var patient = userRepository.findById(patientId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        var allAnswers = userAnswerRepository.findByUserOrderByCreatedAtDesc(patient);
        Map<Long, PsychologistDtos.TestWithAnswersDto> testsMap = new LinkedHashMap<>();

        for (UserAnswerEntity ua : allAnswers) {
            Long testId = ua.getQuestion().getTest().getId();
            testsMap.putIfAbsent(testId, new PsychologistDtos.TestWithAnswersDto(
                    testId, ua.getQuestion().getTest().getCode(), ua.getQuestion().getTest().getTitle(), new ArrayList<>()));
            testsMap.get(testId).answers().add(toAnswerInfo(ua));
        }

        return new PsychologistDtos.PatientDetailDto(
                patient.getId(),
                patient.getName(),
                patient.getEmail(),
                patient.getRole(),
                patient.getCreatedAt(),
                patient.getGender(),
                patient.getAge(),
                patient.getAvatarUrl(),
                new ArrayList<>(testsMap.values())
        );
    }

    @Transactional(readOnly = true)
    public PsychologistDtos.PatientTestAnswersDto getPatientTestAnswers(UserEntity psychologist, Long patientId, Long testId) {
        requirePsychologist(psychologist);
        requirePatientOf(psychologist.getId(), patientId);

        var patient = userRepository.findById(patientId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        var test = testRepository.findById(testId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        List<PsychologistDtos.AnswerInfoDto> answers = new ArrayList<>();
        for (var ua : userAnswerRepository.findByUserOrderByCreatedAtDesc(patient)) {
            if (!ua.getQuestion().getTest().getId().equals(testId)) continue;
            answers.add(toAnswerInfo(ua));
        }

        return new PsychologistDtos.PatientTestAnswersDto(testId, test.getCode(), test.getTitle(), answers);
    }

    @Transactional(readOnly = true)
    public PsychologistDtos.PsychologistProfileDto getProfile(UserEntity psychologist) {
        requirePsychologist(psychologist);
        var profile = psychologistProfileRepository.findByUser(psychologist);

        return new PsychologistDtos.PsychologistProfileDto(
                psychologist.getId(),
                psychologist.getName(),
                psychologist.getEmail(),
                psychologist.getAvatarUrl(),
                psychologist.getGender(),
                psychologist.getAge(),
                psychologist.getIsFull() != null ? psychologist.getIsFull() : false,
                profile.map(PsychologistProfileEntity::getBio).orElse(null),
                profile.map(PsychologistProfileEntity::getEducation).orElse(null),
                profile.map(PsychologistProfileEntity::getCertifications).orElse(null),
                profile.map(PsychologistProfileEntity::getInterests).orElse(null),
                profile.map(PsychologistProfileEntity::getSpecializations).orElse(null),
                profile.map(PsychologistProfileEntity::getExperience).orElse(null),
                profile.map(PsychologistProfileEntity::getLanguages).orElse(null),
                profile.map(PsychologistProfileEntity::getLinkedinUrl).orElse(null),
                profile.map(PsychologistProfileEntity::getWebsite).orElse(null),
                profile.map(PsychologistProfileEntity::getSessionPrices).orElse(null),
                profile.map(PsychologistProfileEntity::getUpdatedAt).orElse(null)
        );
    }

    @Transactional
    public PsychologistDtos.MessageResponse updateProfile(UserEntity psychologist, PsychologistDtos.PsychologistProfileUpdateRequest req) {
        requirePsychologist(psychologist);
        var profileOpt = psychologistProfileRepository.findByUser(psychologist);
        PsychologistProfileEntity profile = profileOpt.orElseGet(() -> {
            var p = new PsychologistProfileEntity();
            p.setUser(psychologist);
            return p;
        });

        if (req.bio() != null) profile.setBio(req.bio());
        if (req.education() != null) profile.setEducation(req.education());
        if (req.certifications() != null) profile.setCertifications(req.certifications());
        if (req.interests() != null) profile.setInterests(req.interests());
        if (req.specializations() != null) profile.setSpecializations(req.specializations());
        if (req.experience() != null) profile.setExperience(req.experience());
        if (req.languages() != null) profile.setLanguages(req.languages());
        if (req.linkedinUrl() != null) profile.setLinkedinUrl(req.linkedinUrl());
        if (req.website() != null) profile.setWebsite(req.website());
        if (req.sessionPrices() != null) profile.setSessionPrices(req.sessionPrices());
        profile.setUpdatedAt(Instant.now());
        psychologistProfileRepository.save(profile);
        return new PsychologistDtos.MessageResponse("Perfil actualizado exitosamente");
    }

    @Transactional
    public PsychologistDtos.UpdateIsFullResponse updateIsFull(UserEntity psychologist, PsychologistDtos.UpdateIsFullRequest req) {
        requirePsychologist(psychologist);
        if (req.isFull() != null) {
            psychologist.setIsFull(req.isFull());
            userRepository.save(psychologist);
        }
        return new PsychologistDtos.UpdateIsFullResponse("Estado actualizado exitosamente", psychologist.getIsFull());
    }

    @Transactional
    public PsychologistDtos.UpdatePatientStatusResponse updatePatientStatus(UserEntity psychologist, Long patientId, PsychologistDtos.UpdatePatientStatusRequest req) {
        requirePsychologist(psychologist);
        if (req.status() == null || req.status().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status es obligatorio");
        }
        if (!"ACTIVE".equals(req.status()) && !"DISCHARGED".equals(req.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status debe ser ACTIVE o DISCHARGED");
        }
        var relOpt = userPsychologistRepository.findByUserId(patientId);
        if (relOpt.isEmpty() || !relOpt.get().getPsychologist().getId().equals(psychologist.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este usuario no es tu paciente");
        }
        var rel = relOpt.get();
        rel.setStatus(req.status());
        userPsychologistRepository.save(rel);
        return new PsychologistDtos.UpdatePatientStatusResponse("Status del paciente actualizado exitosamente", rel.getStatus());
    }

    private void requirePsychologist(UserEntity user) {
        if (!RoleConstants.PSYCHOLOGIST.equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private void requirePatientOf(Long psychologistId, Long patientId) {
        var rel = userPsychologistRepository.findByUserId(patientId);
        if (rel.isEmpty() || !rel.get().getPsychologist().getId().equals(psychologistId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este usuario no es tu paciente");
        }
    }

    private PsychologistDtos.AnswerInfoDto toAnswerInfo(UserAnswerEntity ua) {
        Long answerId = null;
        String answerText = null;
        Integer answerValue = null;
        if (ua.getAnswer() != null) {
            answerId = ua.getAnswer().getId();
            answerText = ua.getAnswer().getText();
            answerValue = ua.getAnswer().getValue();
        }
        return new PsychologistDtos.AnswerInfoDto(
                ua.getQuestion().getId(),
                ua.getQuestion().getText(),
                ua.getQuestion().getPosition(),
                ua.getQuestion().getType(),
                answerId,
                answerText,
                answerValue,
                ua.getNumericValue(),
                ua.getTextValue(),
                ua.getCreatedAt()
        );
    }
}
