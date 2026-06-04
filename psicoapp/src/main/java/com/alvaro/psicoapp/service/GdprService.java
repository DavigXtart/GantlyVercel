package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
public class GdprService {
    private static final Logger logger = LoggerFactory.getLogger(GdprService.class);

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final TaskRepository taskRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final DailyMoodEntryRepository dailyMoodEntryRepository;
    private final TestResultRepository testResultRepository;
    private final EvaluationTestResultRepository evaluationTestResultRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final NotificationRepository notificationRepository;
    private final PatientDataRetentionService patientDataRetentionService;
    private final ChatEncryptionService chatEncryptionService;
    private final AuditService auditService;
    private final PasswordEncoder passwordEncoder;

    public GdprService(UserRepository userRepository,
                       AppointmentRepository appointmentRepository,
                       TaskRepository taskRepository,
                       ChatMessageRepository chatMessageRepository,
                       DailyMoodEntryRepository dailyMoodEntryRepository,
                       TestResultRepository testResultRepository,
                       EvaluationTestResultRepository evaluationTestResultRepository,
                       UserAnswerRepository userAnswerRepository,
                       NotificationRepository notificationRepository,
                       PatientDataRetentionService patientDataRetentionService,
                       ChatEncryptionService chatEncryptionService,
                       AuditService auditService,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
        this.taskRepository = taskRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.dailyMoodEntryRepository = dailyMoodEntryRepository;
        this.testResultRepository = testResultRepository;
        this.evaluationTestResultRepository = evaluationTestResultRepository;
        this.userAnswerRepository = userAnswerRepository;
        this.notificationRepository = notificationRepository;
        this.patientDataRetentionService = patientDataRetentionService;
        this.chatEncryptionService = chatEncryptionService;
        this.auditService = auditService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> exportUserData(UserEntity user) {
        auditService.logDataExport(user.getId(), user.getRole(), user.getId(), "RGPD_SELF_EXPORT", "JSON");

        Map<String, Object> data = new LinkedHashMap<>();

        // Profile
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("name", user.getName());
        profile.put("email", user.getEmail());
        profile.put("gender", user.getGender());
        profile.put("age", user.getAge());
        profile.put("birthDate", user.getBirthDate());
        profile.put("role", user.getRole());
        profile.put("createdAt", user.getCreatedAt());
        profile.put("gdprConsentAt", user.getGdprConsentAt());
        profile.put("gdprConsentVersion", user.getGdprConsentVersion());
        data.put("profile", profile);

        // Mood entries
        var moods = dailyMoodEntryRepository.findByUser_IdOrderByEntryDateDesc(user.getId());
        List<Map<String, Object>> moodList = new ArrayList<>();
        for (var mood : moods) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date", mood.getEntryDate());
            m.put("moodRating", mood.getMoodRating());
            m.put("emotions", mood.getEmotions());
            m.put("activities", mood.getActivities());
            m.put("companions", mood.getCompanions());
            m.put("location", mood.getLocation());
            m.put("notes", mood.getNotes());
            moodList.add(m);
        }
        data.put("moodEntries", moodList);

        // Appointments
        var appointments = appointmentRepository.findByUser_IdOrderByStartTimeAsc(user.getId());
        List<Map<String, Object>> apptList = new ArrayList<>();
        for (var appt : appointments) {
            Map<String, Object> a = new LinkedHashMap<>();
            a.put("startTime", appt.getStartTime());
            a.put("endTime", appt.getEndTime());
            a.put("status", appt.getStatus());
            a.put("paymentStatus", appt.getPaymentStatus());
            apptList.add(a);
        }
        data.put("appointments", apptList);

        // Tasks
        var tasks = taskRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
        List<Map<String, Object>> taskList = new ArrayList<>();
        for (var task : tasks) {
            Map<String, Object> t = new LinkedHashMap<>();
            t.put("title", task.getTitle());
            t.put("description", task.getDescription());
            t.put("completed", task.getCompletedAt() != null);
            t.put("completedAt", task.getCompletedAt());
            t.put("createdAt", task.getCreatedAt());
            taskList.add(t);
        }
        data.put("tasks", taskList);

        // Evaluation test results
        var evalResults = evaluationTestResultRepository.findByUser_IdOrderByCompletedAtDesc(user.getId());
        List<Map<String, Object>> evalList = new ArrayList<>();
        for (var r : evalResults) {
            Map<String, Object> e = new LinkedHashMap<>();
            e.put("testName", r.getTest() != null ? r.getTest().getTitle() : null);
            e.put("score", r.getScore());
            e.put("level", r.getLevel());
            e.put("completedAt", r.getCompletedAt());
            evalList.add(e);
        }
        data.put("evaluationResults", evalList);

        // Test answers
        var answers = userAnswerRepository.findByUser(user);
        List<Map<String, Object>> answerList = new ArrayList<>();
        for (var ua : answers) {
            Map<String, Object> ans = new LinkedHashMap<>();
            ans.put("question", ua.getQuestion() != null ? ua.getQuestion().getText() : null);
            ans.put("answer", ua.getAnswer() != null ? ua.getAnswer().getText() : null);
            ans.put("numericValue", ua.getNumericValue());
            ans.put("textValue", ua.getTextValue());
            answerList.add(ans);
        }
        data.put("testAnswers", answerList);

        // Notifications
        var notifications = notificationRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
        List<Map<String, Object>> notifList = new ArrayList<>();
        for (var n : notifications) {
            Map<String, Object> nMap = new LinkedHashMap<>();
            nMap.put("type", n.getType());
            nMap.put("title", n.getTitle());
            nMap.put("message", n.getMessage());
            nMap.put("read", n.isRead());
            nMap.put("createdAt", n.getCreatedAt());
            notifList.add(nMap);
        }
        data.put("notifications", notifList);

        // Chat messages (decrypted) — RGPD-8
        var chatMessages = chatMessageRepository.findByUser_IdOrderByCreatedAtAsc(user.getId());
        List<Map<String, Object>> chatList = new ArrayList<>();
        for (var msg : chatMessages) {
            Map<String, Object> cm = new LinkedHashMap<>();
            cm.put("sender", msg.getSender());
            cm.put("createdAt", msg.getCreatedAt());
            // Decrypt message content
            String content = msg.getContent();
            if (content != null && !content.isEmpty()) {
                try {
                    content = chatEncryptionService.decrypt(content,
                        msg.getPsychologist().getId(), msg.getUser().getId());
                } catch (Exception e) {
                    logger.warn("RGPD export: could not decrypt chat message id={}", msg.getId());
                    content = "[encrypted]";
                }
            }
            cm.put("content", content);
            cm.put("hasAttachment", msg.getAttachmentPath() != null);
            chatList.add(cm);
        }
        data.put("chatMessages", chatList);

        return data;
    }

    @Transactional
    public void withdrawHealthDataConsent(UserEntity user) {
        user.setHealthDataConsentAt(null);
        user.setHealthDataConsentWithdrawnAt(java.time.Instant.now());
        userRepository.save(user);
        auditService.logDataDeletion(user.getId(), user.getRole(), user.getId(), "HEALTH_CONSENT_WITHDRAWAL");
    }

    @Transactional
    public void deleteUserAccount(UserEntity user, String password) {
        // ADMIN accounts cannot self-delete (use admin panel instead)
        if (RoleConstants.ADMIN.equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Las cuentas de administrador no pueden eliminarse desde aqui");
        }

        // If user has a password (not OAuth-only), require password confirmation
        if (user.getPasswordHash() != null) {
            if (password == null || password.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes confirmar tu contrasena para eliminar la cuenta");
            }
            if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contrasena incorrecta");
            }
        }

        patientDataRetentionService.eraseOneUserInNewTx(user.getId());
    }
}
