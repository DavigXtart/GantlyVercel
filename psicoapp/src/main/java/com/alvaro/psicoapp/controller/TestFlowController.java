package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.repository.*;
import com.alvaro.psicoapp.service.TestResultService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/flow")
public class TestFlowController {
	private final UserRepository userRepository;
	private final QuestionRepository questionRepository;
	private final AnswerRepository answerRepository;
	private final UserAnswerRepository userAnswerRepository;
	private final TestRepository testRepository;
	private final TestResultService testResultService;
	private final AssignedTestRepository assignedTestRepository;

	public TestFlowController(
			UserRepository userRepository,
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

		public static class SubmitItem { public Long questionId; public Long answerId; public Double numericValue; public String textValue; }
	public static class SubmitRequest { public List<SubmitItem> answers; public Long testId; }

	@PostMapping("/submit")
	@Transactional
	public ResponseEntity<Void> submit(Principal principal, @RequestBody SubmitRequest req) {
		UserEntity user = userRepository.findByEmail(principal.getName()).orElseThrow();
		TestEntity test = testRepository.findById(req.testId).orElseThrow();
		
		Map<Long, List<UserAnswerEntity>> existingAnswersByQuestion = userAnswerRepository.findByUser(user).stream()
				.collect(java.util.stream.Collectors.groupingBy(ua -> ua.getQuestion().getId()));
		Set<Long> clearedQuestionIds = new HashSet<>();

		for (SubmitItem it : req.answers) {
			if (it.questionId == null) {
				continue;
			}
			QuestionEntity q = questionRepository.findById(it.questionId).orElseThrow();
			if (!q.getTest().getId().equals(test.getId())) {
				continue;
			}

			if (clearedQuestionIds.add(q.getId())) {
				existingAnswersByQuestion.getOrDefault(q.getId(), Collections.emptyList())
						.forEach(userAnswerRepository::delete);
			}

			boolean hasPayload = (it.answerId != null) || (it.numericValue != null)
					|| (it.textValue != null && !it.textValue.trim().isEmpty());
			if (!hasPayload) {
				continue;
			}

			UserAnswerEntity ua = new UserAnswerEntity();
			ua.setUser(user);
			ua.setQuestion(q);
			if (it.answerId != null) {
				ua.setAnswer(answerRepository.findById(it.answerId).orElse(null));
			}
			if (it.numericValue != null) {
				ua.setNumericValue(it.numericValue);
			}
			if (it.textValue != null && !it.textValue.trim().isEmpty()) {
				ua.setTextValue(it.textValue.trim());
			}
			userAnswerRepository.save(ua);
		}

		// Calcular y guardar resultados
		testResultService.calculateAndSaveResults(user, null, test);
		
		// Marcar el test asignado como completado si existe
		assignedTestRepository.findByUserAndTest(user, test).ifPresent(assigned -> {
			if (assigned.getCompletedAt() == null) {
				assigned.setCompletedAt(Instant.now());
				assignedTestRepository.save(assigned);
			}
		});
		
		return ResponseEntity.ok().build();
	}
}