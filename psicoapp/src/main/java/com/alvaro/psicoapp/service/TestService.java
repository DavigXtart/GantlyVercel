package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.dto.TestDtos;
import com.alvaro.psicoapp.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TestService {
    private final TestRepository testRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;

    public TestService(TestRepository testRepository, QuestionRepository questionRepository, AnswerRepository answerRepository) {
        this.testRepository = testRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
    }

    @Transactional(readOnly = true)
    public Optional<TestDtos.TestDetailResponse> getTestDetail(Long id) {
        return testRepository.findById(id).map(test -> {
            List<QuestionEntity> questions = questionRepository.findByTestOrderByPositionAsc(test);
            List<TestDtos.QuestionDto> questionsData = questions.stream().map(q -> {
                TestDtos.SubfactorDto sf = null;
                if (q.getSubfactor() != null) {
                    TestDtos.FactorDto f = q.getSubfactor().getFactor() != null
                            ? new TestDtos.FactorDto(q.getSubfactor().getFactor().getId(), q.getSubfactor().getFactor().getCode(), q.getSubfactor().getFactor().getName())
                            : null;
                    sf = new TestDtos.SubfactorDto(q.getSubfactor().getId(), q.getSubfactor().getCode(), q.getSubfactor().getName(), f);
                }
                List<AnswerEntity> answers = answerRepository.findByQuestionOrderByPositionAsc(q);
                var answersData = answers.stream().map(a -> new TestDtos.AnswerDto(a.getId(), a.getText(), a.getValue(), a.getPosition())).collect(Collectors.toList());
                return new TestDtos.QuestionDto(q.getId(), q.getText(), q.getType(), q.getPosition(), sf, answersData);
            }).collect(Collectors.toList());
            return new TestDtos.TestDetailResponse(test.getId(), test.getCode(), test.getTitle(), test.getDescription(), test.getActive(), questionsData);
        });
    }

    @Transactional(readOnly = true)
    public List<TestEntity> listTestsWithoutQuestions() {
        List<TestEntity> tests = testRepository.findAll();
        tests.forEach(t -> t.setQuestions(null));
        return tests;
    }
}
