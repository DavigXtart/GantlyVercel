package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.QuestionEntity;
import com.alvaro.psicoapp.domain.TestEntity;
import com.alvaro.psicoapp.domain.UserAnswerEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.TestFlowDtos;
import com.alvaro.psicoapp.repository.AnswerRepository;
import com.alvaro.psicoapp.repository.AssignedTestRepository;
import com.alvaro.psicoapp.repository.QuestionRepository;
import com.alvaro.psicoapp.repository.TestRepository;
import com.alvaro.psicoapp.repository.UserAnswerRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TestFlowService {
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final TestRepository testRepository;
    private final TestResultService testResultService;
    private final AssignedTestRepository assignedTestRepository;

    public TestFlowService(UserRepository userRepository,
                           QuestionRepository questionRepository,
                           AnswerRepository answerRepository,
                           UserAnswerRepository userAnswerRepository,
                           TestRepository testRepository,
                           TestResultService testResultService,
                           AssignedTestRepository assignedTestRepository) {
        this.userRepository = userRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.userAnswerRepository = userAnswerRepository;
        this.testRepository = testRepository;
        this.testResultService = testResultService;
        this.assignedTestRepository = assignedTestRepository;
    }

    @Transactional
    public void submit(String principalEmail, TestFlowDtos.SubmitRequest req) {
        if (principalEmail == null || principalEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("Principal inválido");
        }
        if (req == null || req.testId() == null) {
            throw new IllegalArgumentException("testId requerido");
        }
        if (req.answers() == null) {
            throw new IllegalArgumentException("answers requerido");
        }

        UserEntity user = userRepository.findByEmail(principalEmail).orElseThrow();
        TestEntity test = testRepository.findById(req.testId()).orElseThrow();

        Map<Long, List<UserAnswerEntity>> existingAnswersByQuestion = userAnswerRepository.findByUser(user).stream()
                .collect(Collectors.groupingBy(ua -> ua.getQuestion().getId()));
        Set<Long> clearedQuestionIds = new HashSet<>();

        for (TestFlowDtos.SubmitItem it : req.answers()) {
            if (it.questionId() == null) continue;
            QuestionEntity q = questionRepository.findById(it.questionId()).orElseThrow();
            if (!q.getTest().getId().equals(test.getId())) continue;

            if (clearedQuestionIds.add(q.getId())) {
                existingAnswersByQuestion.getOrDefault(q.getId(), Collections.emptyList())
                        .forEach(userAnswerRepository::delete);
            }

            boolean hasPayload = (it.answerId() != null) || (it.numericValue() != null)
                    || (it.textValue() != null && !it.textValue().trim().isEmpty());
            if (!hasPayload) continue;

            UserAnswerEntity ua = new UserAnswerEntity();
            ua.setUser(user);
            ua.setQuestion(q);
            if (it.answerId() != null) {
                ua.setAnswer(answerRepository.findById(it.answerId()).orElse(null));
            }
            if (it.numericValue() != null) {
                ua.setNumericValue(it.numericValue());
            }
            if (it.textValue() != null && !it.textValue().trim().isEmpty()) {
                ua.setTextValue(it.textValue().trim());
            }
            userAnswerRepository.save(ua);
        }

        testResultService.calculateAndSaveResults(user, null, test);

        assignedTestRepository.findByUserAndTest(user, test).ifPresent(assigned -> {
            if (assigned.getCompletedAt() == null) {
                assigned.setCompletedAt(Instant.now());
                assignedTestRepository.save(assigned);
            }
        });
    }
}

