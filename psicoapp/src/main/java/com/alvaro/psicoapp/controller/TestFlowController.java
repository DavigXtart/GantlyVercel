package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/flow")
public class TestFlowController {
	private final UserRepository userRepository;
	private final QuestionRepository questionRepository;
	private final AnswerRepository answerRepository;
	private final UserAnswerRepository userAnswerRepository;

	public TestFlowController(UserRepository userRepository, QuestionRepository questionRepository, AnswerRepository answerRepository, UserAnswerRepository userAnswerRepository) {
		this.userRepository = userRepository;
		this.questionRepository = questionRepository;
		this.answerRepository = answerRepository;
		this.userAnswerRepository = userAnswerRepository;
	}

	public static class SubmitItem { public Long questionId; public Long answerId; public Double numericValue; }
	public static class SubmitRequest { public List<SubmitItem> answers; }

	@PostMapping("/submit")
	public ResponseEntity<Void> submit(Principal principal, @RequestBody SubmitRequest req) {
		UserEntity user = userRepository.findByEmail(principal.getName()).orElseThrow();
		for (SubmitItem it : req.answers) {
			QuestionEntity q = questionRepository.findById(it.questionId).orElseThrow();
			UserAnswerEntity ua = new UserAnswerEntity();
			ua.setUser(user);
			ua.setQuestion(q);
			if (it.answerId != null) {
				ua.setAnswer(answerRepository.findById(it.answerId).orElse(null));
			}
			ua.setNumericValue(it.numericValue);
			userAnswerRepository.save(ua);
		}
		return ResponseEntity.ok().build();
	}
}