package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserPsychologistRepository userPsychologistRepository;

    @Mock
    private PsychologistProfileRepository psychologistProfileRepository;

    @Mock
    private DailyMoodEntryRepository dailyMoodEntryRepository;

    @Mock
    private UserAnswerRepository userAnswerRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private EvaluationTestResultRepository evaluationTestResultRepository;

    @Mock
    private PatientDataRetentionService patientDataRetentionService;

    @Mock
    private AuditService auditService;

    private UserProfileService userProfileService;

    private UserEntity testUser;

    @BeforeEach
    void setUp() {
        userProfileService = new UserProfileService(
                userRepository,
                userPsychologistRepository,
                psychologistProfileRepository,
                dailyMoodEntryRepository,
                userAnswerRepository,
                appointmentRepository,
                taskRepository,
                evaluationTestResultRepository,
                patientDataRetentionService,
                auditService
        );

        testUser = new UserEntity();
        testUser.setId(1L);
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");
        testUser.setRole(RoleConstants.USER);
        testUser.setGender("male");
        testUser.setAge(30);
        testUser.setBirthDate(LocalDate.of(1995, 6, 15));
        testUser.setCreatedAt(Instant.now().minus(365, ChronoUnit.DAYS));
    }

    // ── exportUserData ──────────────────────────────────────────────────

    @Test
    @DisplayName("exportUserData - returns all data categories")
    void exportUserData_returnsAllDataTypes() {
        // Set up mood entries
        DailyMoodEntryEntity mood = new DailyMoodEntryEntity();
        mood.setEntryDate(LocalDate.now());
        mood.setMoodRating(4);
        mood.setEmotions("happy,calm");
        mood.setActivities("reading");
        mood.setCompanions("alone");
        mood.setLocation("home");
        mood.setNotes("Good day");
        when(dailyMoodEntryRepository.findByUser_IdOrderByEntryDateDesc(1L))
                .thenReturn(List.of(mood));

        // Set up appointments
        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setStartTime(Instant.now());
        appointment.setEndTime(Instant.now().plus(1, ChronoUnit.HOURS));
        appointment.setStatus("BOOKED");
        when(appointmentRepository.findByUser_IdOrderByStartTimeAsc(1L))
                .thenReturn(List.of(appointment));

        // Set up tasks
        TaskEntity task = new TaskEntity();
        task.setTitle("Meditation exercise");
        task.setDescription("Practice 10 minutes of mindfulness");
        task.setCompletedAt(null);
        task.setCreatedAt(Instant.now());
        when(taskRepository.findByUser_IdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(task));

        // Set up evaluation test results
        EvaluationTestResultEntity evalResult = new EvaluationTestResultEntity();
        EvaluationTestEntity evalTest = new EvaluationTestEntity();
        evalTest.setTitle("Anxiety Scale");
        evalResult.setTest(evalTest);
        evalResult.setScore(new BigDecimal("15.5"));
        evalResult.setLevel("moderate");
        evalResult.setCompletedAt(Instant.now());
        when(evaluationTestResultRepository.findByUser_IdOrderByCompletedAtDesc(1L))
                .thenReturn(List.of(evalResult));

        // Set up user answers
        UserAnswerEntity userAnswer = new UserAnswerEntity();
        QuestionEntity question = new QuestionEntity();
        question.setText("How are you feeling?");
        userAnswer.setQuestion(question);
        AnswerEntity answer = new AnswerEntity();
        answer.setText("Good");
        userAnswer.setAnswer(answer);
        userAnswer.setNumericValue(4.0);
        userAnswer.setTextValue(null);
        when(userAnswerRepository.findByUser(testUser))
                .thenReturn(List.of(userAnswer));

        Map<String, Object> result = userProfileService.exportUserData(testUser);

        // Verify audit log was called
        verify(auditService).logDataExport(1L, RoleConstants.USER, 1L, "RGPD_SELF_EXPORT", "JSON");

        // Verify all top-level keys exist
        assertNotNull(result);
        assertTrue(result.containsKey("profile"));
        assertTrue(result.containsKey("moodEntries"));
        assertTrue(result.containsKey("appointments"));
        assertTrue(result.containsKey("tasks"));
        assertTrue(result.containsKey("evaluationResults"));
        assertTrue(result.containsKey("testAnswers"));

        // Verify profile data
        @SuppressWarnings("unchecked")
        Map<String, Object> profile = (Map<String, Object>) result.get("profile");
        assertEquals("Test User", profile.get("name"));
        assertEquals("test@example.com", profile.get("email"));
        assertEquals("male", profile.get("gender"));
        assertEquals(30, profile.get("age"));
        assertEquals(LocalDate.of(1995, 6, 15), profile.get("birthDate"));

        // Verify mood entries
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> moodList = (List<Map<String, Object>>) result.get("moodEntries");
        assertEquals(1, moodList.size());
        assertEquals(4, moodList.get(0).get("moodRating"));
        assertEquals("happy,calm", moodList.get(0).get("emotions"));
        assertEquals("home", moodList.get(0).get("location"));

        // Verify appointments
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> apptList = (List<Map<String, Object>>) result.get("appointments");
        assertEquals(1, apptList.size());
        assertEquals("BOOKED", apptList.get(0).get("status"));

        // Verify tasks
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> taskList = (List<Map<String, Object>>) result.get("tasks");
        assertEquals(1, taskList.size());
        assertEquals("Meditation exercise", taskList.get(0).get("title"));
        assertEquals("Practice 10 minutes of mindfulness", taskList.get(0).get("description"));
        assertEquals(false, taskList.get(0).get("completed"));
        assertNull(taskList.get(0).get("completedAt"));

        // Verify evaluation results
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> evalList = (List<Map<String, Object>>) result.get("evaluationResults");
        assertEquals(1, evalList.size());
        assertEquals("Anxiety Scale", evalList.get(0).get("testName"));
        assertEquals(new BigDecimal("15.5"), evalList.get(0).get("score"));
        assertEquals("moderate", evalList.get(0).get("level"));

        // Verify test answers
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> answerList = (List<Map<String, Object>>) result.get("testAnswers");
        assertEquals(1, answerList.size());
        assertEquals("How are you feeling?", answerList.get(0).get("question"));
        assertEquals("Good", answerList.get(0).get("answer"));
        assertEquals(4.0, answerList.get(0).get("numericValue"));
    }

    @Test
    @DisplayName("exportUserData - returns empty lists when user has no data")
    void exportUserData_noData_returnsEmptyLists() {
        when(dailyMoodEntryRepository.findByUser_IdOrderByEntryDateDesc(1L))
                .thenReturn(Collections.emptyList());
        when(appointmentRepository.findByUser_IdOrderByStartTimeAsc(1L))
                .thenReturn(Collections.emptyList());
        when(taskRepository.findByUser_IdOrderByCreatedAtDesc(1L))
                .thenReturn(Collections.emptyList());
        when(evaluationTestResultRepository.findByUser_IdOrderByCompletedAtDesc(1L))
                .thenReturn(Collections.emptyList());
        when(userAnswerRepository.findByUser(testUser))
                .thenReturn(Collections.emptyList());

        Map<String, Object> result = userProfileService.exportUserData(testUser);

        assertNotNull(result);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> moodList = (List<Map<String, Object>>) result.get("moodEntries");
        assertTrue(moodList.isEmpty());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> apptList = (List<Map<String, Object>>) result.get("appointments");
        assertTrue(apptList.isEmpty());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> taskList = (List<Map<String, Object>>) result.get("tasks");
        assertTrue(taskList.isEmpty());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> evalList = (List<Map<String, Object>>) result.get("evaluationResults");
        assertTrue(evalList.isEmpty());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> answerList = (List<Map<String, Object>>) result.get("testAnswers");
        assertTrue(answerList.isEmpty());

        // Profile should still be populated
        @SuppressWarnings("unchecked")
        Map<String, Object> profile = (Map<String, Object>) result.get("profile");
        assertEquals("Test User", profile.get("name"));
    }

    @Test
    @DisplayName("exportUserData - handles null question and answer in user answers")
    void exportUserData_nullQuestionAndAnswer_handlesGracefully() {
        when(dailyMoodEntryRepository.findByUser_IdOrderByEntryDateDesc(1L))
                .thenReturn(Collections.emptyList());
        when(appointmentRepository.findByUser_IdOrderByStartTimeAsc(1L))
                .thenReturn(Collections.emptyList());
        when(taskRepository.findByUser_IdOrderByCreatedAtDesc(1L))
                .thenReturn(Collections.emptyList());
        when(evaluationTestResultRepository.findByUser_IdOrderByCompletedAtDesc(1L))
                .thenReturn(Collections.emptyList());

        // Answer with null question text scenario (question itself is not null but we test
        // the eval result test being null)
        UserAnswerEntity userAnswer = new UserAnswerEntity();
        QuestionEntity question = new QuestionEntity();
        question.setText("Some question");
        userAnswer.setQuestion(question);
        userAnswer.setAnswer(null);  // null answer
        userAnswer.setNumericValue(3.0);
        userAnswer.setTextValue("free text");
        when(userAnswerRepository.findByUser(testUser))
                .thenReturn(List.of(userAnswer));

        Map<String, Object> result = userProfileService.exportUserData(testUser);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> answerList = (List<Map<String, Object>>) result.get("testAnswers");
        assertEquals(1, answerList.size());
        assertEquals("Some question", answerList.get(0).get("question"));
        assertNull(answerList.get(0).get("answer"));
        assertEquals(3.0, answerList.get(0).get("numericValue"));
        assertEquals("free text", answerList.get(0).get("textValue"));
    }

    // ── deleteAccount ───────────────────────────────────────────────────

    @Test
    @DisplayName("deleteAccount - delegates to patientDataRetentionService for USER role")
    void deleteAccount_userRole_delegatesToRetentionService() {
        testUser.setRole(RoleConstants.USER);

        userProfileService.deleteAccount(testUser);

        verify(patientDataRetentionService).eraseOneUserInNewTx(1L);
    }

    @Test
    @DisplayName("deleteAccount - throws 403 for PSYCHOLOGIST role")
    void deleteAccount_psychologistRole_throwsForbidden() {
        testUser.setRole(RoleConstants.PSYCHOLOGIST);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userProfileService.deleteAccount(testUser));

        assertEquals(403, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("Solo usuarios"));
        verify(patientDataRetentionService, never()).eraseOneUserInNewTx(any());
    }

    @Test
    @DisplayName("deleteAccount - throws 403 for ADMIN role")
    void deleteAccount_adminRole_throwsForbidden() {
        testUser.setRole(RoleConstants.ADMIN);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userProfileService.deleteAccount(testUser));

        assertEquals(403, ex.getStatusCode().value());
        verify(patientDataRetentionService, never()).eraseOneUserInNewTx(any());
    }
}
