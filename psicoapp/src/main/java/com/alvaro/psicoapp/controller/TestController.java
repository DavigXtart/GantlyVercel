package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tests")
public class TestController {
	private final TestRepository testRepository;
	private final QuestionRepository questionRepository;
	private final AnswerRepository answerRepository;
	
	public TestController(TestRepository testRepository, QuestionRepository questionRepository, AnswerRepository answerRepository) {
		this.testRepository = testRepository;
		this.questionRepository = questionRepository;
		this.answerRepository = answerRepository;
	}

	@GetMapping
	public List<TestEntity> list() { 
		List<TestEntity> tests = testRepository.findAll();
		// Evitar recursión circular con questions
		tests.forEach(t -> t.setQuestions(null));
		return tests;
	}

	@GetMapping("/{id}")
	public ResponseEntity<Map<String, Object>> get(@PathVariable Long id) {
		return testRepository.findById(id).map(test -> {
			Map<String, Object> result = new HashMap<>();
			result.put("id", test.getId());
			result.put("code", test.getCode());
			result.put("title", test.getTitle());
			result.put("description", test.getDescription());
			result.put("active", test.getActive());
			
			// Cargar preguntas ordenadas por posición
			List<QuestionEntity> questions = questionRepository.findByTestOrderByPositionAsc(test);
			List<Map<String, Object>> questionsData = questions.stream().map(q -> {
				Map<String, Object> qMap = new HashMap<>();
				qMap.put("id", q.getId());
				qMap.put("text", q.getText());
				qMap.put("type", q.getType());
				qMap.put("position", q.getPosition());
				
				// Cargar respuestas ordenadas por posición
				List<AnswerEntity> answers = answerRepository.findByQuestionOrderByPositionAsc(q);
				List<Map<String, Object>> answersData = answers.stream().map(a -> {
					Map<String, Object> aMap = new HashMap<>();
					aMap.put("id", a.getId());
					aMap.put("text", a.getText());
					aMap.put("value", a.getValue());
					aMap.put("position", a.getPosition());
					return aMap;
				}).collect(Collectors.toList());
				
				qMap.put("answers", answersData);
				return qMap;
			}).collect(Collectors.toList());
			
			result.put("questions", questionsData);
			return ResponseEntity.ok(result);
		}).orElse(ResponseEntity.notFound().build());
	}
}