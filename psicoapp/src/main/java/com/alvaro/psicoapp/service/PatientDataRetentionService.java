package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.repository.*;
import com.alvaro.psicoapp.domain.UserEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * RGPD - Retención y borrado/anominización automática de datos de pacientes.
 *
 * Requisito: borrar los datos de pacientes cada 5 años.
 *
 * Implementación:
 * - Selecciona usuarios con role=USER y createdAt anterior a cutoff (5 años).
 * - Borra datos dependientes (chat, respuestas, resultados, tareas, citas, etc).
 * - Anonimiza la fila de usuario para evitar PII y mantener integridad referencial.
 *
 * Nota: Esto es "borrado lógico" de PII + borrado físico de datos clínicos/transaccionales.
 */
@Service
public class PatientDataRetentionService {
    private static final Logger logger = LoggerFactory.getLogger(PatientDataRetentionService.class);

    private static final int RETENTION_YEARS = 5;

    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final EvaluationTestResultRepository evaluationTestResultRepository;
    private final TestResultRepository testResultRepository;
    private final FactorResultRepository factorResultRepository;
    private final AssignedTestRepository assignedTestRepository;
    private final DailyMoodEntryRepository dailyMoodEntryRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final TaskFileRepository taskFileRepository;
    private final TaskRepository taskRepository;
    private final AppointmentRatingRepository appointmentRatingRepository;
    private final AppointmentRequestRepository appointmentRequestRepository;
    private final AppointmentRepository appointmentRepository;
    private final AuditService auditService;

    public PatientDataRetentionService(
        UserRepository userRepository,
        UserPsychologistRepository userPsychologistRepository,
        ChatMessageRepository chatMessageRepository,
        UserAnswerRepository userAnswerRepository,
        EvaluationTestResultRepository evaluationTestResultRepository,
        TestResultRepository testResultRepository,
        FactorResultRepository factorResultRepository,
        AssignedTestRepository assignedTestRepository,
        DailyMoodEntryRepository dailyMoodEntryRepository,
        TaskCommentRepository taskCommentRepository,
        TaskFileRepository taskFileRepository,
        TaskRepository taskRepository,
        AppointmentRatingRepository appointmentRatingRepository,
        AppointmentRequestRepository appointmentRequestRepository,
        AppointmentRepository appointmentRepository,
        AuditService auditService
    ) {
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.userAnswerRepository = userAnswerRepository;
        this.evaluationTestResultRepository = evaluationTestResultRepository;
        this.testResultRepository = testResultRepository;
        this.factorResultRepository = factorResultRepository;
        this.assignedTestRepository = assignedTestRepository;
        this.dailyMoodEntryRepository = dailyMoodEntryRepository;
        this.taskCommentRepository = taskCommentRepository;
        this.taskFileRepository = taskFileRepository;
        this.taskRepository = taskRepository;
        this.appointmentRatingRepository = appointmentRatingRepository;
        this.appointmentRequestRepository = appointmentRequestRepository;
        this.appointmentRepository = appointmentRepository;
        this.auditService = auditService;
    }

    /**
     * Ejecuta diariamente a las 02:30.
     */
    @Scheduled(cron = "0 30 2 * * *")
    public void runRetentionJob() {
        Instant cutoff = Instant.now().minus(RETENTION_YEARS, ChronoUnit.YEARS);
        List<UserEntity> candidates = userRepository.findByRoleAndCreatedAtBefore(RoleConstants.USER, cutoff);

        if (candidates.isEmpty()) return;

        logger.warn("RGPD retention: {} usuarios candidatos para borrado/anominización (cutoff={})",
            candidates.size(), cutoff);

        for (UserEntity u : candidates) {
            try {
                eraseOneUserInNewTx(u.getId());
            } catch (Exception e) {
                logger.error("RGPD retention: error procesando userId={}", u.getId(), e);
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void eraseOneUserInNewTx(Long userId) {
        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user == null) return;
        if (!RoleConstants.USER.equals(user.getRole())) return;

        // Auditoría RGPD
        auditService.logDataDeletion(userId, RoleConstants.USER, userId, "PATIENT_DATA_ERASURE");

        // 1) Borrar comentarios y ficheros de tareas (y ficheros en disco)
        deleteTaskFilesOnDisk(userId);
        taskCommentRepository.deleteByTask_User_Id(userId);
        taskFileRepository.deleteByTask_User_Id(userId);
        taskRepository.deleteByUser_Id(userId);

        // 2) Borrar ratings/requests/appointments
        appointmentRatingRepository.deleteByUser_Id(userId);
        appointmentRequestRepository.deleteByUser_Id(userId);
        appointmentRepository.deleteByUser_Id(userId);

        // 3) Borrar chat
        chatMessageRepository.deleteByUser_Id(userId);

        // 4) Borrar respuestas y resultados
        userAnswerRepository.deleteByUser_Id(userId);
        evaluationTestResultRepository.deleteByUser_Id(userId);
        testResultRepository.deleteByUser_Id(userId);
        factorResultRepository.deleteByUser_Id(userId);
        assignedTestRepository.deleteByUser_Id(userId);

        // 5) Borrar entradas de ánimo
        dailyMoodEntryRepository.deleteByUser_Id(userId);

        // 6) Borrar relación con psicólogo
        userPsychologistRepository.deleteByUserId(userId);

        // 7) Anonimizar PII del usuario
        anonymizeUser(user);
        userRepository.save(user);
    }

    private void deleteTaskFilesOnDisk(Long userId) {
        try {
            var files = taskFileRepository.findByTask_User_Id(userId);
            for (var f : files) {
                if (f == null || f.getFilePath() == null || f.getFilePath().isBlank()) continue;
                try {
                    Path p = Path.of(f.getFilePath());
                    if (Files.exists(p)) Files.delete(p);
                } catch (RuntimeException | java.io.IOException e) {
                    logger.warn("RGPD retention: no se pudo borrar archivo {}", f.getFilePath(), e);
                }
            }
        } catch (Exception e) {
            logger.warn("RGPD retention: error leyendo/borrando ficheros en disco para userId={}", userId, e);
        }
    }

    private void anonymizeUser(UserEntity user) {
        Long id = user.getId();
        String nonce = UUID.randomUUID().toString().substring(0, 8);

        user.setName("Usuario eliminado");
        // Mantener unicidad: email único por ID + nonce
        user.setEmail("anon-" + id + "-" + nonce + "@deleted.local");
        user.setPasswordHash(null);
        user.setOauth2Provider(null);
        user.setOauth2ProviderId(null);
        user.setAvatarUrl(null);
        user.setGender(null);
        user.setAge(null);
        user.setDarkMode(false);
        user.setEmailVerified(false);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiresAt(null);
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiresAt(null);
        user.setCompanyId(null);
        user.setReferralCode(null);
        user.setIsFull(false);
    }
}

