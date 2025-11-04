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
	private final SubfactorRepository subfactorRepository;
	private final FactorRepository factorRepository;

	public AdminController(TestRepository testRepository, QuestionRepository questionRepository, 
	                     AnswerRepository answerRepository, UserRepository userRepository,
	                     UserAnswerRepository userAnswerRepository,
	                     SubfactorRepository subfactorRepository,
	                     FactorRepository factorRepository) {
		this.testRepository = testRepository;
		this.questionRepository = questionRepository;
		this.answerRepository = answerRepository;
		this.userRepository = userRepository;
		this.userAnswerRepository = userAnswerRepository;
		this.subfactorRepository = subfactorRepository;
		this.factorRepository = factorRepository;
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
		TestEntity savedTest = testRepository.save(t);
		
		// Inicializar estructura por defecto automáticamente
		initDefaultStructureForTest(savedTest.getId());
		
		return ResponseEntity.ok(savedTest);
	}
	
	// Método privado para inicializar estructura por defecto (sin verificación de existencia)
	private void initDefaultStructureForTest(Long testId) {
		TestEntity test = testRepository.findById(testId).orElseThrow();
		
		// Crear factores
		FactorEntity f1 = new FactorEntity();
		f1.setTest(test);
		f1.setCode("COMPETENCIAS_SOCIALES");
		f1.setName("Competencias sociales");
		f1.setDescription("Competencias relacionadas con la interacción social");
		f1.setPosition(1);
		f1 = factorRepository.save(f1);
		
		FactorEntity f2 = new FactorEntity();
		f2.setTest(test);
		f2.setCode("COMPETENCIAS_AUTONOMIA");
		f2.setName("Competencias de autonomía e independencia");
		f2.setDescription("Competencias relacionadas con la autonomía e independencia");
		f2.setPosition(2);
		f2 = factorRepository.save(f2);
		
		FactorEntity f3 = new FactorEntity();
		f3.setTest(test);
		f3.setCode("COMPETENCIAS_APERTURA");
		f3.setName("Competencias de apertura y adaptación");
		f3.setDescription("Competencias relacionadas con la apertura y adaptación");
		f3.setPosition(3);
		f3 = factorRepository.save(f3);
		
		FactorEntity f4 = new FactorEntity();
		f4.setTest(test);
		f4.setCode("COMPETENCIAS_AUTOCONTROL");
		f4.setName("Competencias de autocontrol");
		f4.setDescription("Competencias relacionadas con el autocontrol");
		f4.setPosition(4);
		f4 = factorRepository.save(f4);
		
		FactorEntity f5 = new FactorEntity();
		f5.setTest(test);
		f5.setCode("COMPETENCIAS_ANSIEDAD");
		f5.setName("Competencias de gestión de la ansiedad");
		f5.setDescription("Competencias relacionadas con la gestión de la ansiedad");
		f5.setPosition(5);
		f5 = factorRepository.save(f5);
		
		// Crear subfactores para Competencias sociales
		createSubfactor(test, f1, "A", "Extroversión", "Cercanía afectiva, trato cordial e interés genuino por las personas.", 1);
		createSubfactor(test, f1, "F", "Animación", "Energía visible, expresividad en la interacción, tono vital alto.", 2);
		createSubfactor(test, f1, "N(-)", "Espontaneidad / Privacidad–Astucia", "Filtra y dosifica lo que muestra; gestiona su imagen y lee subtextos.", 3);
		createSubfactor(test, f1, "Q2(-)", "Participación grupal", "Preferencia por actuar solo; baja orientación grupal.", 4);
		
		// Crear subfactores para Competencias de autonomía e independencia
		createSubfactor(test, f2, "E", "Dominancia", "Asumir control e influir en interacciones.", 1);
		createSubfactor(test, f2, "H", "Emprendimiento", "Atrevimiento y desenvoltura ante exposición social y situaciones nuevas.", 2);
		createSubfactor(test, f2, "Q2", "Autosuficiencia", "Baja dependencia del grupo; autonomía para avanzar y decidir.", 3);
		createSubfactor(test, f2, "Q1", "Crítico", "Actitud analítica; revisa creencias y adopta cambios con evidencia.", 4);
		
		// Crear subfactores para Competencias de apertura y adaptación
		createSubfactor(test, f3, "I", "Idealismo", "Sensibilidad y orientación a principios éticos y armonía.", 1);
		createSubfactor(test, f3, "M", "Creatividad", "Pensamiento imaginativo y asociativo; generación de ideas nuevas.", 2);
		createSubfactor(test, f3, "Q1_AP", "Apertura al cambio", "Flexibilidad ante nuevas ideas y experiencias.", 3);
		
		// Crear subfactores para Competencias de autocontrol
		createSubfactor(test, f4, "G", "Sentido del deber", "Responsabilidad, adherencia a normas y estándares.", 1);
		createSubfactor(test, f4, "Q3", "Control de emociones", "Perfeccionismo, organización y autorregulación emocional.", 2);
		
		// Crear subfactores para Competencias de gestión de la ansiedad
		createSubfactor(test, f5, "C", "Estabilidad", "Calma, equilibrio emocional y recuperación ante el estrés.", 1);
		createSubfactor(test, f5, "O", "Aprehensión", "Autocrítica, auto-duda y tendencia a la culpabilidad.", 2);
		createSubfactor(test, f5, "L", "Vigilancia", "Cautela, expectativa de segundas intenciones.", 3);
		createSubfactor(test, f5, "Q4", "Tensión", "Activación interna, impaciencia e irritabilidad ante contratiempos.", 4);
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

	// GET: Obtener estructura del test (factores y subfactores)
	@GetMapping("/tests/{testId}/structure")
	public ResponseEntity<Map<String, Object>> getTestStructure(@PathVariable Long testId) {
		TestEntity test = testRepository.findById(testId).orElse(null);
		if (test == null) return ResponseEntity.notFound().build();

		Map<String, Object> resp = new HashMap<>();
		List<SubfactorEntity> subfactors = subfactorRepository.findAll().stream()
				.filter(sf -> sf.getTest() != null && Objects.equals(sf.getTest().getId(), testId))
				.sorted(Comparator.comparing(SubfactorEntity::getPosition))
				.collect(Collectors.toList());

		List<Map<String, Object>> factors = new ArrayList<>();
		Map<Long, Map<String, Object>> factorMap = new LinkedHashMap<>();
		
		// Si hay subfactores, agruparlos por factor
		for (SubfactorEntity sf : subfactors) {
			FactorEntity f = sf.getFactor();
			Long fid = f != null ? f.getId() : -1L;
			factorMap.putIfAbsent(fid, new HashMap<String, Object>() {{
				put("id", fid);
				put("code", f != null ? f.getCode() : "-");
				put("name", f != null ? f.getName() : "Sin factor");
				put("subfactors", new ArrayList<>());
			}});
			@SuppressWarnings("unchecked")
			List<Map<String, Object>> sflist = (List<Map<String, Object>>) factorMap.get(fid).get("subfactors");
			Map<String, Object> sfm = new HashMap<>();
			sfm.put("id", sf.getId());
			sfm.put("code", sf.getCode());
			sfm.put("name", sf.getName());
			sflist.add(sfm);
		}
		factors.addAll(factorMap.values());
		
		// Asegurar que siempre hay un array, aunque esté vacío
		resp.put("factors", factors);

		return ResponseEntity.ok(resp);
	}

	// POST: Crear factor
	public static class FactorCreate { 
		public Long testId; 
		public String code; 
		public String name; 
		public String description; 
		public Integer position; 
	}
	@PostMapping("/factors")
	public ResponseEntity<Map<String, Object>> createFactor(@RequestBody FactorCreate req) {
		TestEntity test = testRepository.findById(req.testId).orElseThrow();
		FactorEntity f = new FactorEntity();
		f.setTest(test);
		f.setCode(req.code);
		f.setName(req.name);
		if (req.description != null) f.setDescription(req.description);
		f.setPosition(req.position != null ? req.position : 1);
		FactorEntity saved = factorRepository.save(f);
		
		Map<String, Object> result = new HashMap<>();
		result.put("id", saved.getId());
		result.put("code", saved.getCode());
		result.put("name", saved.getName());
		result.put("testId", saved.getTest().getId());
		result.put("position", saved.getPosition());
		return ResponseEntity.ok(result);
	}

	// POST: Crear subfactor
	public static class SubfactorCreate { 
		public Long testId; 
		public String code; 
		public String name; 
		public String description; 
		public Long factorId; // Opcional
		public Integer position; 
	}
	@PostMapping("/subfactors")
	public ResponseEntity<Map<String, Object>> createSubfactor(@RequestBody SubfactorCreate req) {
		TestEntity test = testRepository.findById(req.testId).orElseThrow();
		SubfactorEntity sf = new SubfactorEntity();
		sf.setTest(test);
		sf.setCode(req.code);
		sf.setName(req.name);
		if (req.description != null) sf.setDescription(req.description);
		if (req.factorId != null) {
			factorRepository.findById(req.factorId).ifPresent(sf::setFactor);
		}
		sf.setPosition(req.position != null ? req.position : 1);
		SubfactorEntity saved = subfactorRepository.save(sf);
		
		Map<String, Object> result = new HashMap<>();
		result.put("id", saved.getId());
		result.put("code", saved.getCode());
		result.put("name", saved.getName());
		result.put("testId", saved.getTest().getId());
		result.put("position", saved.getPosition());
		if (saved.getFactor() != null) {
			result.put("factorId", saved.getFactor().getId());
		}
		return ResponseEntity.ok(result);
	}

	// POST: Inicializar estructura por defecto (factores y subfactores)
	@PostMapping("/tests/{testId}/init-structure")
	public ResponseEntity<Map<String, Object>> initDefaultStructure(@PathVariable Long testId) {
		TestEntity test = testRepository.findById(testId).orElseThrow();
		
		// Verificar si ya hay factores
		List<FactorEntity> existingFactors = factorRepository.findAll().stream()
				.filter(f -> f.getTest() != null && Objects.equals(f.getTest().getId(), testId))
				.collect(Collectors.toList());
		if (!existingFactors.isEmpty()) {
			Map<String, Object> error = new HashMap<>();
			error.put("error", "El test ya tiene factores configurados");
			return ResponseEntity.badRequest().body(error);
		}
		
		// Crear factores
		FactorEntity f1 = new FactorEntity();
		f1.setTest(test);
		f1.setCode("COMPETENCIAS_SOCIALES");
		f1.setName("Competencias sociales");
		f1.setDescription("Competencias relacionadas con la interacción social");
		f1.setPosition(1);
		f1 = factorRepository.save(f1);
		
		FactorEntity f2 = new FactorEntity();
		f2.setTest(test);
		f2.setCode("COMPETENCIAS_AUTONOMIA");
		f2.setName("Competencias de autonomía e independencia");
		f2.setDescription("Competencias relacionadas con la autonomía e independencia");
		f2.setPosition(2);
		f2 = factorRepository.save(f2);
		
		FactorEntity f3 = new FactorEntity();
		f3.setTest(test);
		f3.setCode("COMPETENCIAS_APERTURA");
		f3.setName("Competencias de apertura y adaptación");
		f3.setDescription("Competencias relacionadas con la apertura y adaptación");
		f3.setPosition(3);
		f3 = factorRepository.save(f3);
		
		FactorEntity f4 = new FactorEntity();
		f4.setTest(test);
		f4.setCode("COMPETENCIAS_AUTOCONTROL");
		f4.setName("Competencias de autocontrol");
		f4.setDescription("Competencias relacionadas con el autocontrol");
		f4.setPosition(4);
		f4 = factorRepository.save(f4);
		
		FactorEntity f5 = new FactorEntity();
		f5.setTest(test);
		f5.setCode("COMPETENCIAS_ANSIEDAD");
		f5.setName("Competencias de gestión de la ansiedad");
		f5.setDescription("Competencias relacionadas con la gestión de la ansiedad");
		f5.setPosition(5);
		f5 = factorRepository.save(f5);
		
		// Crear subfactores para Competencias sociales
		createSubfactor(test, f1, "A", "Extroversión", "Cercanía afectiva, trato cordial e interés genuino por las personas.", 1);
		createSubfactor(test, f1, "F", "Animación", "Energía visible, expresividad en la interacción, tono vital alto.", 2);
		createSubfactor(test, f1, "N(-)", "Espontaneidad / Privacidad–Astucia", "Filtra y dosifica lo que muestra; gestiona su imagen y lee subtextos.", 3);
		createSubfactor(test, f1, "Q2(-)", "Participación grupal", "Preferencia por actuar solo; baja orientación grupal.", 4);
		
		// Crear subfactores para Competencias de autonomía e independencia
		createSubfactor(test, f2, "E", "Dominancia", "Asumir control e influir en interacciones.", 1);
		createSubfactor(test, f2, "H", "Emprendimiento", "Atrevimiento y desenvoltura ante exposición social y situaciones nuevas.", 2);
		createSubfactor(test, f2, "Q2", "Autosuficiencia", "Baja dependencia del grupo; autonomía para avanzar y decidir.", 3);
		createSubfactor(test, f2, "Q1", "Crítico", "Actitud analítica; revisa creencias y adopta cambios con evidencia.", 4);
		
		// Crear subfactores para Competencias de apertura y adaptación
		createSubfactor(test, f3, "I", "Idealismo", "Sensibilidad y orientación a principios éticos y armonía.", 1);
		createSubfactor(test, f3, "M", "Creatividad", "Pensamiento imaginativo y asociativo; generación de ideas nuevas.", 2);
		createSubfactor(test, f3, "Q1", "Apertura al cambio", "Flexibilidad ante nuevas ideas y experiencias.", 3);
		
		// Crear subfactores para Competencias de autocontrol
		createSubfactor(test, f4, "G", "Sentido del deber", "Responsabilidad, adherencia a normas y estándares.", 1);
		createSubfactor(test, f4, "Q3", "Control de emociones", "Perfeccionismo, organización y autorregulación emocional.", 2);
		
		// Crear subfactores para Competencias de gestión de la ansiedad
		createSubfactor(test, f5, "C", "Estabilidad", "Calma, equilibrio emocional y recuperación ante el estrés.", 1);
		createSubfactor(test, f5, "O", "Aprehensión", "Autocrítica, auto-duda y tendencia a la culpabilidad.", 2);
		createSubfactor(test, f5, "L", "Vigilancia", "Cautela, expectativa de segundas intenciones.", 3);
		createSubfactor(test, f5, "Q4", "Tensión", "Activación interna, impaciencia e irritabilidad ante contratiempos.", 4);
		
		Map<String, Object> result = new HashMap<>();
		result.put("success", true);
		result.put("message", "Estructura por defecto inicializada correctamente");
		return ResponseEntity.ok(result);
	}
	
	private void createSubfactor(TestEntity test, FactorEntity factor, String code, String name, String description, Integer position) {
		SubfactorEntity sf = new SubfactorEntity();
		sf.setTest(test);
		sf.setFactor(factor);
		sf.setCode(code);
		sf.setName(name);
		sf.setDescription(description);
		sf.setPosition(position);
		subfactorRepository.save(sf);
	}
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
		public Long subfactorId; // Opcional: subfactor al que pertenece
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
		if (req.subfactorId != null) {
			subfactorRepository.findById(req.subfactorId).ifPresent(q::setSubfactor);
		}
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
	public static class QuestionUpdate { public String text; public String type; public Integer position; public Long subfactorId; }
	@PutMapping("/questions/{id}")
	public ResponseEntity<QuestionEntity> updateQuestion(@PathVariable Long id, @RequestBody QuestionUpdate req) {
		return questionRepository.findById(id).map(question -> {
			if (req.text != null) question.setText(req.text);
			if (req.type != null) question.setType(req.type);
			if (req.position != null) question.setPosition(req.position);
			if (req.subfactorId != null) {
				subfactorRepository.findById(req.subfactorId).ifPresent(question::setSubfactor);
			} else if (req.subfactorId == null && req.text == null && req.type == null && req.position == null) {
				// Solo si se envía explícitamente null para limpiar
				question.setSubfactor(null);
			}
			return ResponseEntity.ok(questionRepository.save(question));
		}).orElse(ResponseEntity.notFound().build());
	}

	// PUT: Establecer subfactor de una pregunta
	public static class SetSubfactorReq { public Long subfactorId; }
	@PutMapping("/questions/{id}/subfactor")
	public ResponseEntity<Void> setQuestionSubfactor(@PathVariable Long id, @RequestBody SetSubfactorReq req) {
		return questionRepository.findById(id).map(question -> {
			if (req.subfactorId == null) {
				question.setSubfactor(null);
			} else {
				subfactorRepository.findById(req.subfactorId).ifPresent(question::setSubfactor);
			}
			questionRepository.save(question);
			return ResponseEntity.ok().<Void>build();
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