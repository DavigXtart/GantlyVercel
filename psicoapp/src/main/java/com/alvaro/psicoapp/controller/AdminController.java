package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
	private final TestRepository testRepository;
	private final QuestionRepository questionRepository;
	private final AnswerRepository answerRepository;
	private final UserRepository userRepository;
	private final UserAnswerRepository userAnswerRepository;

	public AdminController(TestRepository testRepository, QuestionRepository questionRepository, 
	                     AnswerRepository answerRepository, UserRepository userRepository,
	                     UserAnswerRepository userAnswerRepository) {
		this.testRepository = testRepository;
		this.questionRepository = questionRepository;
		this.answerRepository = answerRepository;
		this.userRepository = userRepository;
		this.userAnswerRepository = userAnswerRepository;
	}

	// GET: Listar todos los tests
	@GetMapping("/tests")
	public List<TestEntity> listTests() {
		List<TestEntity> tests = testRepository.findAll();
		// Evitar recursión circular con questions
		tests.forEach(t -> t.setQuestions(null));
		return tests;
	}

	// GET: Obtener test completo con preguntas y respuestas
	@GetMapping("/tests/{id}")
	public ResponseEntity<TestEntity> getTestWithDetails(@PathVariable Long id) {
		return testRepository.findById(id)
			.map(ResponseEntity::ok)
			.orElse(ResponseEntity.notFound().build());
	}

	// POST: Crear test
	public static class TestCreate { public String code; public String title; public String description; }
	@PostMapping("/tests")
	public ResponseEntity<TestEntity> createTest(@RequestBody TestCreate req) {
		TestEntity t = new TestEntity();
		t.setCode(req.code); 
		t.setTitle(req.title); 
		t.setDescription(req.description);
		t.setActive(true);
		return ResponseEntity.ok(testRepository.save(t));
	}

	// PUT: Actualizar test
	public static class TestUpdate { public String code; public String title; public String description; public Boolean active; }
	@PutMapping("/tests/{id}")
	public ResponseEntity<TestEntity> updateTest(@PathVariable Long id, @RequestBody TestUpdate req) {
		return testRepository.findById(id).map(test -> {
			if (req.code != null) test.setCode(req.code);
			if (req.title != null) test.setTitle(req.title);
			if (req.description != null) test.setDescription(req.description);
			if (req.active != null) test.setActive(req.active);
			return ResponseEntity.ok(testRepository.save(test));
		}).orElse(ResponseEntity.notFound().build());
	}

	// DELETE: Eliminar test
	@DeleteMapping("/tests/{id}")
	public ResponseEntity<Void> deleteTest(@PathVariable Long id) {
		if (testRepository.existsById(id)) {
			testRepository.deleteById(id);
			return ResponseEntity.ok().build();
		}
		return ResponseEntity.notFound().build();
	}

	// GET: Obtener preguntas de un test
	@GetMapping("/tests/{testId}/questions")
	public List<Map<String, Object>> getQuestions(@PathVariable Long testId) {
		TestEntity test = testRepository.findById(testId).orElseThrow();
		List<QuestionEntity> questions = questionRepository.findByTestOrderByPositionAsc(test);
		return questions.stream().map(q -> {
			Map<String, Object> qMap = new HashMap<>();
			qMap.put("id", q.getId());
			qMap.put("text", q.getText());
			qMap.put("type", q.getType());
			qMap.put("position", q.getPosition());
			// No incluir la relación con test para evitar recursión circular
			return qMap;
		}).collect(Collectors.toList());
	}

	// POST: Crear pregunta
	public static class QuestionCreate { 
		public Long testId; 
		public String text; 
		public String type; 
		public Integer position;
		public List<AnswerOption> answers; // Opcional: respuestas a crear junto con la pregunta
	}
	public static class AnswerOption {
		public String text;
		public Integer value;
		public Integer position;
	}
	@PostMapping("/questions")
	public ResponseEntity<Map<String, Object>> createQuestion(@RequestBody QuestionCreate req) {
		TestEntity t = testRepository.findById(req.testId).orElseThrow();
		QuestionEntity q = new QuestionEntity();
		q.setTest(t); 
		q.setText(req.text); 
		q.setType(req.type); 
		q.setPosition(req.position);
		QuestionEntity savedQuestion = questionRepository.save(q);
		
		// Crear respuestas si se proporcionan
		if (req.answers != null && !req.answers.isEmpty()) {
			for (AnswerOption answerOpt : req.answers) {
				AnswerEntity a = new AnswerEntity();
				a.setQuestion(savedQuestion);
				a.setText(answerOpt.text);
				a.setValue(answerOpt.value != null ? answerOpt.value : 0);
				a.setPosition(answerOpt.position != null ? answerOpt.position : 1);
				answerRepository.save(a);
			}
		}
		
		// Devolver como Map para evitar recursión circular
		Map<String, Object> result = new HashMap<>();
		result.put("id", savedQuestion.getId());
		result.put("text", savedQuestion.getText());
		result.put("type", savedQuestion.getType());
		result.put("position", savedQuestion.getPosition());
		return ResponseEntity.ok(result);
	}

	// PUT: Actualizar pregunta
	public static class QuestionUpdate { public String text; public String type; public Integer position; }
	@PutMapping("/questions/{id}")
	public ResponseEntity<QuestionEntity> updateQuestion(@PathVariable Long id, @RequestBody QuestionUpdate req) {
		return questionRepository.findById(id).map(question -> {
			if (req.text != null) question.setText(req.text);
			if (req.type != null) question.setType(req.type);
			if (req.position != null) question.setPosition(req.position);
			return ResponseEntity.ok(questionRepository.save(question));
		}).orElse(ResponseEntity.notFound().build());
	}

	// DELETE: Eliminar pregunta
	@DeleteMapping("/questions/{id}")
	public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
		if (questionRepository.existsById(id)) {
			questionRepository.deleteById(id);
			return ResponseEntity.ok().build();
		}
		return ResponseEntity.notFound().build();
	}

	// GET: Obtener respuestas de una pregunta
	@GetMapping("/questions/{questionId}/answers")
	public List<AnswerEntity> getAnswers(@PathVariable Long questionId) {
		QuestionEntity question = questionRepository.findById(questionId).orElseThrow();
		return answerRepository.findByQuestionOrderByPositionAsc(question);
	}

	// POST: Crear respuesta
	public static class AnswerCreate { public Long questionId; public String text; public Integer value; public Integer position; }
	@PostMapping("/answers")
	public ResponseEntity<AnswerEntity> createAnswer(@RequestBody AnswerCreate req) {
		QuestionEntity q = questionRepository.findById(req.questionId).orElseThrow();
		AnswerEntity a = new AnswerEntity();
		a.setQuestion(q); 
		a.setText(req.text); 
		a.setValue(req.value); 
		a.setPosition(req.position);
		return ResponseEntity.ok(answerRepository.save(a));
	}

	// PUT: Actualizar respuesta
	public static class AnswerUpdate { public String text; public Integer value; public Integer position; }
	@PutMapping("/answers/{id}")
	public ResponseEntity<AnswerEntity> updateAnswer(@PathVariable Long id, @RequestBody AnswerUpdate req) {
		return answerRepository.findById(id).map(answer -> {
			if (req.text != null) answer.setText(req.text);
			if (req.value != null) answer.setValue(req.value);
			if (req.position != null) answer.setPosition(req.position);
			return ResponseEntity.ok(answerRepository.save(answer));
		}).orElse(ResponseEntity.notFound().build());
	}

	// DELETE: Eliminar respuesta
	@DeleteMapping("/answers/{id}")
	public ResponseEntity<Void> deleteAnswer(@PathVariable Long id) {
		if (answerRepository.existsById(id)) {
			answerRepository.deleteById(id);
			return ResponseEntity.ok().build();
		}
		return ResponseEntity.notFound().build();
	}

	// GET: Listar todos los usuarios
	@GetMapping("/users")
	public List<Map<String, Object>> listUsers() {
		return userRepository.findAll().stream().map(user -> {
			Map<String, Object> userMap = new HashMap<>();
			userMap.put("id", user.getId());
			userMap.put("name", user.getName());
			userMap.put("email", user.getEmail());
			userMap.put("role", user.getRole());
			userMap.put("createdAt", user.getCreatedAt());
			// Contar tests completados
			List<UserAnswerEntity> answers = userAnswerRepository.findByUser(user);
			Set<Long> testIds = answers.stream()
				.map(ua -> ua.getQuestion().getTest().getId())
				.collect(Collectors.toSet());
			userMap.put("testsCompleted", testIds.size());
			return userMap;
		}).collect(Collectors.toList());
	}

	// GET: Obtener usuario con sus respuestas
	@GetMapping("/users/{userId}")
	public ResponseEntity<Map<String, Object>> getUserDetails(@PathVariable Long userId) {
		return userRepository.findById(userId).map(user -> {
			Map<String, Object> userMap = new HashMap<>();
			userMap.put("id", user.getId());
			userMap.put("name", user.getName());
			userMap.put("email", user.getEmail());
			userMap.put("role", user.getRole());
			userMap.put("createdAt", user.getCreatedAt());
			
			// Obtener todas las respuestas del usuario agrupadas por test
			List<UserAnswerEntity> allAnswers = userAnswerRepository.findByUserOrderByCreatedAtDesc(user);
			Map<Long, Map<String, Object>> testsMap = new HashMap<>();
			
			for (UserAnswerEntity ua : allAnswers) {
				Long testId = ua.getQuestion().getTest().getId();
				if (!testsMap.containsKey(testId)) {
					TestEntity test = ua.getQuestion().getTest();
					Map<String, Object> testInfo = new HashMap<>();
					testInfo.put("testId", testId);
					testInfo.put("testCode", test.getCode());
					testInfo.put("testTitle", test.getTitle());
					testInfo.put("answers", new ArrayList<Map<String, Object>>());
					testsMap.put(testId, testInfo);
				}
				
				Map<String, Object> answerInfo = new HashMap<>();
				answerInfo.put("questionId", ua.getQuestion().getId());
				answerInfo.put("questionText", ua.getQuestion().getText());
				if (ua.getAnswer() != null) {
					answerInfo.put("answerId", ua.getAnswer().getId());
					answerInfo.put("answerText", ua.getAnswer().getText());
					answerInfo.put("answerValue", ua.getAnswer().getValue());
				}
				if (ua.getNumericValue() != null) {
					answerInfo.put("numericValue", ua.getNumericValue());
				}
				answerInfo.put("createdAt", ua.getCreatedAt());
				
				@SuppressWarnings("unchecked")
				List<Map<String, Object>> answers = (List<Map<String, Object>>) testsMap.get(testId).get("answers");
				answers.add(answerInfo);
			}
			
			userMap.put("tests", new ArrayList<>(testsMap.values()));
			return ResponseEntity.ok(userMap);
		}).orElse(ResponseEntity.notFound().build());
	}

	// GET: Obtener respuestas de usuarios por test
	@GetMapping("/tests/{testId}/user-answers")
	public ResponseEntity<List<Map<String, Object>>> getTestUserAnswers(@PathVariable Long testId) {
		TestEntity test = testRepository.findById(testId).orElse(null);
		if (test == null) {
			return ResponseEntity.notFound().build();
		}
		
		// Obtener todas las preguntas del test
		List<QuestionEntity> questions = questionRepository.findByTestOrderByPositionAsc(test);
		Set<Long> questionIds = questions.stream().map(QuestionEntity::getId).collect(Collectors.toSet());
		
		// Obtener todas las respuestas de usuarios para estas preguntas
		List<UserAnswerEntity> allUserAnswers = userAnswerRepository.findAll().stream()
			.filter(ua -> questionIds.contains(ua.getQuestion().getId()))
			.collect(Collectors.toList());
		
		// Agrupar por usuario y luego por test
		Map<Long, Map<String, Object>> usersMap = new HashMap<>();
		
		for (UserAnswerEntity ua : allUserAnswers) {
			Long userId = ua.getUser().getId();
			Long testIdFromAnswer = ua.getQuestion().getTest().getId();
			
			if (!usersMap.containsKey(userId)) {
				Map<String, Object> userInfo = new HashMap<>();
				userInfo.put("userId", userId);
				userInfo.put("userName", ua.getUser().getName());
				userInfo.put("userEmail", ua.getUser().getEmail());
				userInfo.put("tests", new ArrayList<Map<String, Object>>());
				usersMap.put(userId, userInfo);
			}
			
			Map<String, Object> userInfo = usersMap.get(userId);
			@SuppressWarnings("unchecked")
			List<Map<String, Object>> testsList = (List<Map<String, Object>>) userInfo.get("tests");
			
			// Buscar si ya existe el test en la lista del usuario
			Map<String, Object> testInfo = testsList.stream()
				.filter(t -> t.get("testId").equals(testIdFromAnswer))
				.findFirst()
				.orElse(null);
			
			if (testInfo == null) {
				testInfo = new HashMap<>();
				testInfo.put("testId", testIdFromAnswer);
				testInfo.put("testCode", ua.getQuestion().getTest().getCode());
				testInfo.put("testTitle", ua.getQuestion().getTest().getTitle());
				testInfo.put("answers", new ArrayList<Map<String, Object>>());
				testsList.add(testInfo);
			}
			
			@SuppressWarnings("unchecked")
			List<Map<String, Object>> answersList = (List<Map<String, Object>>) testInfo.get("answers");
			
			Map<String, Object> answerInfo = new HashMap<>();
			answerInfo.put("questionId", ua.getQuestion().getId());
			answerInfo.put("questionText", ua.getQuestion().getText());
			if (ua.getAnswer() != null) {
				answerInfo.put("answerId", ua.getAnswer().getId());
				answerInfo.put("answerText", ua.getAnswer().getText());
				answerInfo.put("answerValue", ua.getAnswer().getValue());
			}
			if (ua.getNumericValue() != null) {
				answerInfo.put("numericValue", ua.getNumericValue());
			}
			answerInfo.put("createdAt", ua.getCreatedAt());
			
			answersList.add(answerInfo);
		}
		
		return ResponseEntity.ok(new ArrayList<>(usersMap.values()));
	}
}