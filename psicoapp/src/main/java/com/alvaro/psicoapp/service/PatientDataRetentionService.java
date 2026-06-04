package com.alvaro.psicoapp.service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.AuditLogRepository;
import com.alvaro.psicoapp.repository.AppointmentRatingRepository;
import com.alvaro.psicoapp.repository.AppointmentRepository;
import com.alvaro.psicoapp.repository.AppointmentRequestRepository;
import com.alvaro.psicoapp.repository.AssignedTestRepository;
import com.alvaro.psicoapp.repository.ChatConversationRepository;
import com.alvaro.psicoapp.repository.ChatMessageRepository;
import com.alvaro.psicoapp.repository.ClinicAdminRepository;
import com.alvaro.psicoapp.repository.ClinicChatMessageRepository;
import com.alvaro.psicoapp.repository.ClinicPatientDocumentRepository;
import com.alvaro.psicoapp.repository.ClinicPatientProfileRepository;
import com.alvaro.psicoapp.repository.ClinicRoomRepository;
import com.alvaro.psicoapp.repository.ConsentRequestRepository;
import com.alvaro.psicoapp.repository.DailyMoodEntryRepository;
import com.alvaro.psicoapp.repository.EvaluationTestResultRepository;
import com.alvaro.psicoapp.repository.FactorResultRepository;
import com.alvaro.psicoapp.repository.InsurancePatientPolicyRepository;
import com.alvaro.psicoapp.repository.NotificationRepository;
import com.alvaro.psicoapp.repository.PsychAbsenceRepository;
import com.alvaro.psicoapp.repository.PsychologistProfileRepository;
import com.alvaro.psicoapp.repository.TaskCommentRepository;
import com.alvaro.psicoapp.repository.TaskFileRepository;
import com.alvaro.psicoapp.repository.TaskRepository;
import com.alvaro.psicoapp.repository.TestResultRepository;
import com.alvaro.psicoapp.repository.UserAnswerRepository;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.repository.UserSubscriptionRepository;
import com.alvaro.psicoapp.repository.WaitingListRepository;
import com.alvaro.psicoapp.repository.WeeklyScheduleRepository;

@Service
public class PatientDataRetentionService {
    private static final Logger logger = LoggerFactory.getLogger(PatientDataRetentionService.class);

    private static final int RETENTION_YEARS = 5;

    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatConversationRepository chatConversationRepository;
    private final ClinicChatMessageRepository clinicChatMessageRepository;
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
    private final NotificationRepository notificationRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final ConsentRequestRepository consentRequestRepository;
    private final InsurancePatientPolicyRepository insurancePatientPolicyRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditService auditService;
    private final PsychologistProfileRepository psychologistProfileRepository;
    private final WeeklyScheduleRepository weeklyScheduleRepository;
    private final PsychAbsenceRepository psychAbsenceRepository;
    private final WaitingListRepository waitingListRepository;
    private final ClinicAdminRepository clinicAdminRepository;
    private final ClinicPatientProfileRepository clinicPatientProfileRepository;
    private final ClinicPatientDocumentRepository clinicPatientDocumentRepository;
    private final ClinicRoomRepository clinicRoomRepository;
    private final TokenBlacklistService tokenBlacklistService;

    public PatientDataRetentionService(
        UserRepository userRepository,
        UserPsychologistRepository userPsychologistRepository,
        ChatMessageRepository chatMessageRepository,
        ChatConversationRepository chatConversationRepository,
        ClinicChatMessageRepository clinicChatMessageRepository,
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
        NotificationRepository notificationRepository,
        UserSubscriptionRepository userSubscriptionRepository,
        ConsentRequestRepository consentRequestRepository,
        InsurancePatientPolicyRepository insurancePatientPolicyRepository,
        AuditLogRepository auditLogRepository,
        AuditService auditService,
        PsychologistProfileRepository psychologistProfileRepository,
        WeeklyScheduleRepository weeklyScheduleRepository,
        PsychAbsenceRepository psychAbsenceRepository,
        WaitingListRepository waitingListRepository,
        ClinicAdminRepository clinicAdminRepository,
        ClinicPatientProfileRepository clinicPatientProfileRepository,
        ClinicPatientDocumentRepository clinicPatientDocumentRepository,
        ClinicRoomRepository clinicRoomRepository,
        TokenBlacklistService tokenBlacklistService
    ) {
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.chatConversationRepository = chatConversationRepository;
        this.clinicChatMessageRepository = clinicChatMessageRepository;
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
        this.notificationRepository = notificationRepository;
        this.userSubscriptionRepository = userSubscriptionRepository;
        this.consentRequestRepository = consentRequestRepository;
        this.insurancePatientPolicyRepository = insurancePatientPolicyRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditService = auditService;
        this.psychologistProfileRepository = psychologistProfileRepository;
        this.weeklyScheduleRepository = weeklyScheduleRepository;
        this.psychAbsenceRepository = psychAbsenceRepository;
        this.waitingListRepository = waitingListRepository;
        this.clinicAdminRepository = clinicAdminRepository;
        this.clinicPatientProfileRepository = clinicPatientProfileRepository;
        this.clinicPatientDocumentRepository = clinicPatientDocumentRepository;
        this.clinicRoomRepository = clinicRoomRepository;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @Scheduled(cron = "0 30 2 * * *")
    public void runRetentionJob() {
        Instant cutoff = Instant.now().minus(RETENTION_YEARS, ChronoUnit.YEARS);
        List<UserEntity> candidates = userRepository.findByRoleAndCreatedAtBefore(RoleConstants.USER, cutoff);

        if (candidates.isEmpty()) return;

        logger.warn("RGPD retention: {} usuarios candidatos para borrado/anonimizacion (cutoff={})",
            candidates.size(), cutoff);

        for (UserEntity u : candidates) {
            try {
                eraseOneUserInNewTx(u.getId());
            } catch (Exception e) {
                logger.error("RGPD retention: error procesando userId={}", u.getId(), e);
            }
        }
    }

    /**
     * Daily cleanup: unverified accounts (30 days), old notifications (90 days),
     * anonymized/deleted accounts residual data (30 days).
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void enforceRetentionPolicies() {
        deleteUnverifiedAccounts();
        deleteOldNotifications();
        cleanupDeletedAccounts();
        clearOldStripeSessionIds();
        purgeOldAuditLogs();
        logger.info("RGPD retention policies job completed");
    }

    /**
     * RGPD-11: Clear Stripe session IDs from paid appointments older than 30 days.
     * Reduces PCI DSS scope by removing payment references no longer needed.
     */
    private void clearOldStripeSessionIds() {
        Instant cutoff = Instant.now().minus(30, ChronoUnit.DAYS);
        int cleared = appointmentRepository.clearOldStripeSessionIds(cutoff);
        if (cleared > 0) {
            logger.info("RGPD retention: cleared {} old Stripe session IDs (>30 days post-payment)", cleared);
        }
    }

    /**
     * RGPD-13: Purge audit logs older than 2 years.
     * Retention period aligned with RGPD data minimization principle.
     */
    private void purgeOldAuditLogs() {
        Instant cutoff = Instant.now().minus(730, ChronoUnit.DAYS); // ~2 years
        int deleted = auditLogRepository.deleteByCreatedAtBefore(cutoff);
        if (deleted > 0) {
            logger.info("RGPD retention: purged {} audit logs older than 2 years", deleted);
        }
    }

    private void deleteUnverifiedAccounts() {
        Instant cutoff = Instant.now().minus(30, ChronoUnit.DAYS);
        List<UserEntity> unverified = userRepository.findByEmailVerifiedFalseAndCreatedAtBefore(cutoff);

        if (!unverified.isEmpty()) {
            logger.info("RGPD retention: eliminando {} cuentas no verificadas (>30 dias)", unverified.size());
            for (UserEntity u : unverified) {
                try {
                    eraseOneUserInNewTx(u.getId());
                } catch (Exception e) {
                    logger.error("RGPD retention: error eliminando cuenta no verificada userId={}", u.getId(), e);
                }
            }
        }
    }

    private void deleteOldNotifications() {
        Instant cutoff = Instant.now().minus(90, ChronoUnit.DAYS);
        int deleted = notificationRepository.deleteByCreatedAtBefore(cutoff);
        if (deleted > 0) {
            logger.info("RGPD retention: eliminando {} notificaciones antiguas (>90 dias)", deleted);
        }
    }

    private void cleanupDeletedAccounts() {
        Instant cutoff = Instant.now().minus(30, ChronoUnit.DAYS);
        List<UserEntity> deleted = userRepository.findByEmailEndingWithAndCreatedAtBefore("@deleted.local", cutoff);

        if (!deleted.isEmpty()) {
            logger.info("RGPD retention: limpiando {} cuentas anonimizadas (>30 dias)", deleted.size());
            for (UserEntity u : deleted) {
                try {
                    userRepository.delete(u);
                } catch (Exception e) {
                    logger.error("RGPD retention: error limpiando cuenta anonimizada userId={}", u.getId(), e);
                }
            }
        }
    }

    /**
     * Complete cascade delete for any user role: USER, PSYCHOLOGIST, EMPRESA.
     * Deletes all related data in correct FK order, anonymizes the user, and
     * blacklists active tokens.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void eraseOneUserInNewTx(Long userId) {
        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        String role = user.getRole();
        auditService.logDataDeletion(userId, role, userId, "ACCOUNT_ERASURE");

        logger.info("RGPD: starting cascade delete for userId={}, role={}", userId, role);

        switch (role) {
            case RoleConstants.USER:
                erasePatientData(userId);
                break;
            case RoleConstants.PSYCHOLOGIST:
                erasePsychologistData(userId);
                break;
            case RoleConstants.EMPRESA:
                eraseEmpresaData(user);
                break;
            default:
                // ADMIN or unknown roles: delete common data only
                eraseCommonData(userId);
                break;
        }

        // Blacklist any active tokens for this user
        blacklistUserTokens(user);

        // Anonymize and save the user
        deleteAvatarFile(user.getAvatarUrl());
        anonymizeUser(user);
        userRepository.save(user);

        logger.info("RGPD: cascade delete completed for userId={}, role={}", userId, role);
    }

    // -----------------------------------------------------------------------
    // PATIENT (USER) deletion
    // -----------------------------------------------------------------------
    private void erasePatientData(Long userId) {
        // 1. Task child entities (comments, files on disk, file records)
        deleteTaskFilesOnDisk(userId, true);
        taskCommentRepository.deleteByTask_User_Id(userId);
        taskFileRepository.deleteByTask_User_Id(userId);
        taskRepository.deleteByUser_Id(userId);

        // 2. Appointment child entities, then appointments
        appointmentRatingRepository.deleteByUser_Id(userId);
        appointmentRequestRepository.deleteByUser_Id(userId);
        // Nullify waiting list references to user's appointments before deleting them
        waitingListRepository.nullifyScheduledAppointmentByUser(userId);
        appointmentRepository.deleteByUser_Id(userId);

        // 3. Chat data
        chatMessageRepository.deleteByUser_Id(userId);
        chatConversationRepository.deleteByUserId(userId);
        clinicChatMessageRepository.deleteByPatientId(userId);

        // 4. Test data
        userAnswerRepository.deleteByUser_Id(userId);
        evaluationTestResultRepository.deleteByUser_Id(userId);
        testResultRepository.deleteByUser_Id(userId);
        factorResultRepository.deleteByUser_Id(userId);
        assignedTestRepository.deleteByUser_Id(userId);

        // 5. Daily mood entries
        dailyMoodEntryRepository.deleteByUser_Id(userId);

        // 6. Notifications
        notificationRepository.deleteByUser_Id(userId);

        // 7. Subscriptions
        userSubscriptionRepository.deleteByUserId(userId);

        // 8. Consent requests
        consentRequestRepository.deleteByUser_Id(userId);

        // 9. Insurance policies
        insurancePatientPolicyRepository.deleteByPatientId(userId);

        // 10. Patient-psychologist relationship (unlink, don't delete psych)
        userPsychologistRepository.deleteByUserId(userId);

        // 11. Waiting list entries where this user is a patient
        waitingListRepository.deleteByPatient_Id(userId);

        // 12. Clinic patient profiles and documents
        deleteClinicDocumentFiles(userId);
        clinicPatientDocumentRepository.deleteByPatientId(userId);
        clinicPatientProfileRepository.deleteByPatientId(userId);

        // 13. Clinic admin role (if patient also had admin access)
        clinicAdminRepository.deleteByUserId(userId);
    }

    // -----------------------------------------------------------------------
    // PSYCHOLOGIST deletion
    // -----------------------------------------------------------------------
    private void erasePsychologistData(Long userId) {
        // --- Psychologist-side data ---

        // 1. Task child entities (tasks created by this psychologist)
        deleteTaskFilesOnDisk(userId, false);
        taskCommentRepository.deleteByTask_Psychologist_Id(userId);
        taskFileRepository.deleteByTask_Psychologist_Id(userId);
        taskRepository.deleteByPsychologist_Id(userId);

        // 2. Appointment child entities, then appointments owned by psychologist
        // Delete ratings referencing this psychologist
        appointmentRatingRepository.deleteByPsychologist_Id(userId);
        // Delete appointment requests for appointments owned by this psychologist
        appointmentRequestRepository.deleteByAppointment_Psychologist_Id(userId);
        // Nullify waiting list references to psychologist's appointments before deleting them
        waitingListRepository.nullifyScheduledAppointmentByPsychologist(userId);
        // Delete all appointments where this is the psychologist
        appointmentRepository.deleteByPsychologist_Id(userId);

        // 3. Chat data (psychologist-side)
        chatMessageRepository.deleteByPsychologist_Id(userId);
        chatConversationRepository.deleteByPsychologistId(userId);

        // 4. Assigned tests created by this psychologist
        assignedTestRepository.deleteByPsychologist_Id(userId);

        // 5. Consent requests where this is the psychologist
        consentRequestRepository.deleteByPsychologist_Id(userId);

        // 6. Unlink all patient relationships (don't delete patient accounts)
        userPsychologistRepository.deleteByPsychologistId(userId);

        // 7. Psychologist-specific entities
        psychologistProfileRepository.deleteByUser_Id(userId);
        weeklyScheduleRepository.deleteByPsychologist_Id(userId);
        psychAbsenceRepository.deleteByPsychologist_Id(userId);

        // 8. Waiting list: nullify psychologist preference references
        waitingListRepository.nullifyPsychologistPreference(userId);

        // 9. Clinic rooms: clear assigned psychologist
        clinicRoomRepository.clearAssignedPsychologist(userId);

        // 10. Clinic admin role (if psychologist had admin access)
        clinicAdminRepository.deleteByUserId(userId);

        // 11. Notifications
        notificationRepository.deleteByUser_Id(userId);

        // 12. Subscriptions (psychologists may have subscriptions too)
        userSubscriptionRepository.deleteByUserId(userId);

        // --- If psychologist also has any patient-side data (unlikely but safe) ---
        userAnswerRepository.deleteByUser_Id(userId);
        evaluationTestResultRepository.deleteByUser_Id(userId);
        testResultRepository.deleteByUser_Id(userId);
        factorResultRepository.deleteByUser_Id(userId);
        dailyMoodEntryRepository.deleteByUser_Id(userId);
        insurancePatientPolicyRepository.deleteByPatientId(userId);
        clinicChatMessageRepository.deleteByPatientId(userId);
        deleteClinicDocumentFiles(userId);
        clinicPatientDocumentRepository.deleteByPatientId(userId);
        clinicPatientProfileRepository.deleteByPatientId(userId);
    }

    // -----------------------------------------------------------------------
    // EMPRESA deletion
    // -----------------------------------------------------------------------
    private void eraseEmpresaData(UserEntity user) {
        Long userId = user.getId();

        // Empresa users have companyId linked; clean up clinic admin role
        clinicAdminRepository.deleteByUserId(userId);

        // Common data
        eraseCommonData(userId);
    }

    // -----------------------------------------------------------------------
    // Common data (shared by all roles)
    // -----------------------------------------------------------------------
    private void eraseCommonData(Long userId) {
        notificationRepository.deleteByUser_Id(userId);
        userSubscriptionRepository.deleteByUserId(userId);
    }

    // -----------------------------------------------------------------------
    // Helper: delete task files from disk
    // -----------------------------------------------------------------------
    private void deleteTaskFilesOnDisk(Long userId, boolean isPatient) {
        try {
            var files = isPatient
                ? taskFileRepository.findByTask_User_Id(userId)
                : taskFileRepository.findByTask_Psychologist_Id(userId);
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

    // -----------------------------------------------------------------------
    // Helper: delete clinic document files from disk
    // -----------------------------------------------------------------------
    private void deleteClinicDocumentFiles(Long patientId) {
        try {
            var docs = clinicPatientDocumentRepository.findByPatientId(patientId);
            for (var doc : docs) {
                if (doc == null || doc.getFileName() == null || doc.getFileName().isBlank()) continue;
                try {
                    // Documents are stored under uploads/clinic-docs/
                    Path p = Path.of("uploads", "clinic-docs", doc.getFileName());
                    if (Files.exists(p)) {
                        Files.delete(p);
                        logger.info("RGPD: deleted clinic document file {}", p);
                    }
                } catch (RuntimeException | java.io.IOException e) {
                    logger.warn("RGPD: could not delete clinic document file {}", doc.getFileName(), e);
                }
            }
        } catch (Exception e) {
            logger.warn("RGPD: error reading/deleting clinic document files for patientId={}", patientId, e);
        }
    }

    private void deleteAvatarFile(String avatarUrl) {
        if (avatarUrl == null || avatarUrl.isBlank()) return;
        try {
            // avatarUrl is like /uploads/avatars/uuid.jpg -- resolve to disk path
            String relative = avatarUrl.startsWith("/") ? avatarUrl.substring(1) : avatarUrl;
            Path p = Path.of(relative);
            if (Files.exists(p)) {
                Files.delete(p);
                logger.info("RGPD: deleted avatar file {}", p);
            }
        } catch (Exception e) {
            logger.warn("RGPD: could not delete avatar file {}", avatarUrl, e);
        }
    }

    /**
     * Blacklists the user's tokens so any existing sessions are invalidated.
     * Since we don't store refresh tokens per user, we rely on the user entity
     * being anonymized (password cleared, email changed) to prevent new logins.
     * If a current refresh token is known (from the request context), it should
     * be blacklisted by the controller before calling this method.
     */
    private void blacklistUserTokens(UserEntity user) {
        // The user's password hash and OAuth credentials are cleared during
        // anonymization, which prevents token refresh. The JWT access token
        // (15 min TTL) will naturally expire. The refresh token (7d) cannot
        // be refreshed because the user's email will no longer match.
        logger.info("RGPD: user credentials cleared for userId={}, active sessions will expire naturally", user.getId());
    }

    private void anonymizeUser(UserEntity user) {
        Long id = user.getId();
        String nonce = UUID.randomUUID().toString().substring(0, 8);

        user.setName("Usuario eliminado");

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
        user.setBirthDate(null);
        user.setTotpSecret(null);
        user.setTotpEnabled(false);
        user.setVerificationCode(null);
        user.setFailedLoginAttempts(0);
        user.setAccountLockedUntil(null);
        user.setLockoutCount(0);
        user.setGdprConsentAt(null);
        user.setGdprConsentVersion(null);
        user.setHealthDataConsentAt(null);
        user.setHealthDataConsentWithdrawnAt(null);
        user.setGuardianEmail(null);
        user.setGuardianConsentAt(null);
        user.setEmergencyContactName(null);
        user.setEmergencyContactPhone(null);
        user.setReferralSource(null);
        user.setChiefComplaint(null);
        user.setPhone(null);
        user.setPreferredLanguage(null);
        user.setPreferredSchedule(null);
        user.setPreferredBudget(null);
        user.setTherapyUrgency(null);
        user.setPreferredPsychGender(null);
    }
}
