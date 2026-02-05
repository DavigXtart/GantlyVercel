package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.dto.InitialTestDtos;
import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class InitialTestService {
    private static final String INITIAL_TEST_CODE = "INITIAL";

    private final TestRepository testRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final TemporarySessionService sessionService;

    public InitialTestService(TestRepository testRepository, QuestionRepository questionRepository,
                              AnswerRepository answerRepository, UserAnswerRepository userAnswerRepository,
                              TemporarySessionService sessionService) {
        this.testRepository = testRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.userAnswerRepository = userAnswerRepository;
        this.sessionService = sessionService;
    }

    @Transactional(readOnly = true)
    public InitialTestDtos.InitialTestResponse getInitialTest(String sessionId) {
        if (sessionService.getSession(sessionId).isEmpty()) {
            throw new IllegalArgumentException("Sesión no válida");
        }
        TestEntity test = testRepository.findByCode(INITIAL_TEST_CODE)
                .orElseThrow(() -> new IllegalArgumentException("Test inicial no configurado"));
        List<QuestionEntity> questions = questionRepository.findByTestOrderByPositionAsc(test);
        List<InitialTestDtos.QuestionDto> questionsData = questions.stream().map(q -> {
            InitialTestDtos.SubfactorDto sf = null;
            if (q.getSubfactor() != null) {
                InitialTestDtos.FactorDto f = q.getSubfactor().getFactor() != null
                        ? new InitialTestDtos.FactorDto(q.getSubfactor().getFactor().getId(), q.getSubfactor().getFactor().getCode(), q.getSubfactor().getFactor().getName())
                        : null;
                sf = new InitialTestDtos.SubfactorDto(q.getSubfactor().getId(), q.getSubfactor().getCode(), q.getSubfactor().getName(), f);
            }
            List<AnswerEntity> answers = answerRepository.findByQuestionOrderByPositionAsc(q);
            var answersData = answers.stream().map(a -> new InitialTestDtos.AnswerDto(a.getId(), a.getText(), a.getValue(), a.getPosition())).collect(Collectors.toList());
            return new InitialTestDtos.QuestionDto(q.getId(), q.getText(), q.getType(), q.getPosition(), sf, answersData);
        }).collect(Collectors.toList());
        return new InitialTestDtos.InitialTestResponse(test.getId(), test.getCode(), test.getTitle(), test.getDescription(), questionsData);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStatus(String sessionId) {
        Optional<TemporarySessionEntity> sessionOpt = sessionService.getSession(sessionId);
        if (sessionOpt.isEmpty()) {
            throw new IllegalArgumentException("Sesión no válida");
        }
        return Map.of("completed", sessionOpt.get().getInitialTestCompleted());
    }

    @Transactional
    public InitialTestDtos.SubmitResponse submitInitialTest(String sessionId, InitialTestDtos.SubmitRequest req) {
        if (req.answers() == null) throw new IllegalArgumentException("Sesión no válida o expirada");

        Optional<TemporarySessionEntity> sessionOpt = sessionService.getSession(sessionId);
        if (sessionOpt.isEmpty()) {
            throw new IllegalArgumentException("Sesión no válida o expirada");
        }
        TemporarySessionEntity session = sessionOpt.get();
        TestEntity test = testRepository.findByCode(INITIAL_TEST_CODE)
                .orElseThrow(() -> new IllegalArgumentException("Test inicial no encontrado"));

        List<UserAnswerEntity> existingSessionAnswers = userAnswerRepository.findBySession(session);
        Map<Long, List<UserAnswerEntity>> answersByQuestion = existingSessionAnswers.stream()
                .collect(Collectors.groupingBy(ua -> ua.getQuestion().getId()));
        Set<Long> clearedQuestionIds = new HashSet<>();

        for (InitialTestDtos.SubmitItem it : req.answers()) {
            if (it.questionId() == null) continue;
            Optional<QuestionEntity> questionOpt = questionRepository.findById(it.questionId());
            if (questionOpt.isEmpty()) continue;
            QuestionEntity q = questionOpt.get();
            if (!q.getTest().getId().equals(test.getId())) continue;

            if (clearedQuestionIds.add(q.getId())) {
                answersByQuestion.getOrDefault(q.getId(), Collections.emptyList())
                        .forEach(userAnswerRepository::delete);
            }

            boolean hasPayload = (it.answerId() != null) || (it.numericValue() != null)
                    || (it.textValue() != null && !it.textValue().trim().isEmpty());
            if (!hasPayload) continue;

            UserAnswerEntity ua = new UserAnswerEntity();
            ua.setSession(session);
            ua.setQuestion(q);
            if (it.answerId() != null) answerRepository.findById(it.answerId()).ifPresent(ua::setAnswer);
            if (it.numericValue() != null) ua.setNumericValue(it.numericValue());
            if (it.textValue() != null && !it.textValue().trim().isEmpty()) ua.setTextValue(it.textValue().trim());
            userAnswerRepository.save(ua);
        }

        sessionService.markInitialTestCompleted(sessionId);
        return new InitialTestDtos.SubmitResponse(true, "Test inicial completado. Ahora puedes crear tu cuenta.");
    }
}
