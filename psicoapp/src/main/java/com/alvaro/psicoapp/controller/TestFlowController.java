package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.repository.*;
import com.alvaro.psicoapp.service.TestResultService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
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

	public TestFlowController(
			UserRepository userRepository,
			QuestionRepository questionRepository,
			AnswerRepository answerRepository,
			UserAnswerRepository userAnswerRepository,
			TestRepository testRepository,
			TestResultService testResultService) {
		this.userRepository = userRepository;
		this.questionRepository = questionRepository;
		this.answerRepository = answerRepository;
		this.userAnswerRepository = userAnswerRepository;
		this.testRepository = testRepository;
		this.testResultService = testResultService;
	}

	public static class SubmitItem { public Long questionId; public Long answerId; public Double numericValue; }
	public static class SubmitRequest { public List<SubmitItem> answers; public Long testId; }

	@PostMapping("/submit")
	public ResponseEntity<Void> submit(Principal principal, @RequestBody SubmitRequest req) {
		UserEntity user = userRepository.findByEmail(principal.getName()).orElseThrow();
		TestEntity test = testRepository.findById(req.testId).orElseThrow();
		
		// Guardar respuestas
		for (SubmitItem it : req.answers) {
			QuestionEntity q = questionRepository.findById(it.questionId).orElseThrow();
			// Verificar que la pregunta pertenece al test
			if (!q.getTest().getId().equals(test.getId())) {
				continue;
			}

			// Eliminar respuesta anterior si existe
			userAnswerRepository.findByUser(user).stream()
					.filter(ua -> ua.getQuestion().getId().equals(q.getId()))
					.forEach(userAnswerRepository::delete);

			UserAnswerEntity ua = new UserAnswerEntity();
			ua.setUser(user);
			ua.setQuestion(q);
			if (it.answerId != null) {
				ua.setAnswer(answerRepository.findById(it.answerId).orElse(null));
			}
			ua.setNumericValue(it.numericValue);
			userAnswerRepository.save(ua);
		}

		// Calcular y guardar resultados
		testResultService.calculateAndSaveResults(user, null, test);
		
		return ResponseEntity.ok().build();
	}
}