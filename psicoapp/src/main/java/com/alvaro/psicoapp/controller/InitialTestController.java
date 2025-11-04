package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.repository.*;
import com.alvaro.psicoapp.service.TestResultService;
import com.alvaro.psicoapp.service.TemporarySessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/initial-test")
public class InitialTestController {
	private final TestRepository testRepository;
	private final QuestionRepository questionRepository;
	private final AnswerRepository answerRepository;
	private final UserAnswerRepository userAnswerRepository;
	private final TemporarySessionService sessionService;
	private final TestResultService testResultService;
	private static final String INITIAL_TEST_CODE = "INITIAL"; // Código del test inicial

	public InitialTestController(
			TestRepository testRepository,
			QuestionRepository questionRepository,
			AnswerRepository answerRepository,
			UserAnswerRepository userAnswerRepository,
			TemporarySessionService sessionService,
			TestResultService testResultService) {
		this.testRepository = testRepository;
		this.questionRepository = questionRepository;
		this.answerRepository = answerRepository;
		this.userAnswerRepository = userAnswerRepository;
		this.sessionService = sessionService;
		this.testResultService = testResultService;
	}

	/**
	 * Crea una nueva sesión temporal y devuelve el ID de sesión
	 */
	@PostMapping("/session")
	public ResponseEntity<Map<String, String>> createSession() {
		TemporarySessionEntity session = sessionService.createSession();
		Map<String, String> response = new HashMap<>();
		response.put("sessionId", session.getSessionId());
		return ResponseEntity.ok(response);
	}

	/**
	 * Obtiene el test inicial
	 */
	@GetMapping
	public ResponseEntity<Map<String, Object>> getInitialTest(@RequestParam String sessionId) {
		// Verificar que la sesión existe
		if (!sessionService.getSession(sessionId).isPresent()) {
			return ResponseEntity.badRequest().build();
		}

		// Buscar el test inicial por código
		Optional<TestEntity> testOpt = testRepository.findByCode(INITIAL_TEST_CODE);
		if (!testOpt.isPresent()) {
			Map<String, Object> error = new HashMap<>();
			error.put("error", "Test inicial no configurado");
			return ResponseEntity.status(404).body(error);
		}

		TestEntity test = testOpt.get();
		Map<String, Object> result = new HashMap<>();
		result.put("id", test.getId());
		result.put("code", test.getCode());
		result.put("title", test.getTitle());
		result.put("description", test.getDescription());

		// Cargar preguntas ordenadas por posición
		List<QuestionEntity> questions = questionRepository.findByTestOrderByPositionAsc(test);
               List<Map<String, Object>> questionsData = questions.stream().map(q -> {
			Map<String, Object> qMap = new HashMap<>();
			qMap.put("id", q.getId());
			qMap.put("text", q.getText());
			qMap.put("type", q.getType());
			qMap.put("position", q.getPosition());

                   // Subfactor y factor
                   if (q.getSubfactor() != null) {
                       Map<String, Object> sf = new HashMap<>();
                       sf.put("id", q.getSubfactor().getId());
                       sf.put("code", q.getSubfactor().getCode());
                       sf.put("name", q.getSubfactor().getName());
                       if (q.getSubfactor().getFactor() != null) {
                           Map<String, Object> f = new HashMap<>();
                           f.put("id", q.getSubfactor().getFactor().getId());
                           f.put("code", q.getSubfactor().getFactor().getCode());
                           f.put("name", q.getSubfactor().getFactor().getName());
                           sf.put("factor", f);
                       }
                       qMap.put("subfactor", sf);
                   }

			// Cargar respuestas ordenadas por posición
			List<AnswerEntity> answers = answerRepository.findByQuestionOrderByPositionAsc(q);
			List<Map<String, Object>> answersData = answers.stream().map(a -> {
				Map<String, Object> aMap = new HashMap<>();
				aMap.put("id", a.getId());
				aMap.put("text", a.getText());
				aMap.put("value", a.getValue());
				aMap.put("position", a.getPosition());
				return aMap;
			}).collect(java.util.stream.Collectors.toList());

			qMap.put("answers", answersData);
			return qMap;
		}).collect(java.util.stream.Collectors.toList());

		result.put("questions", questionsData);
		return ResponseEntity.ok(result);
	}

	/**
	 * Verifica si el test inicial ya fue completado
	 */
	@GetMapping("/status")
	public ResponseEntity<Map<String, Object>> getStatus(@RequestParam String sessionId) {
		Optional<TemporarySessionEntity> sessionOpt = sessionService.getSession(sessionId);
		if (!sessionOpt.isPresent()) {
			return ResponseEntity.badRequest().build();
		}

		Map<String, Object> response = new HashMap<>();
		response.put("completed", sessionOpt.get().getInitialTestCompleted());
		return ResponseEntity.ok(response);
	}

	/**
	 * Envía las respuestas del test inicial
	 */
	@PostMapping("/submit")
	public ResponseEntity<Map<String, Object>> submitInitialTest(
			@RequestParam String sessionId,
			@RequestBody SubmitRequest req) {

		try {
			// Verificar sesión
			Optional<TemporarySessionEntity> sessionOpt = sessionService.getSession(sessionId);
			if (!sessionOpt.isPresent()) {
				Map<String, Object> error = new HashMap<>();
				error.put("error", "Sesión no válida o expirada");
				return ResponseEntity.badRequest().body(error);
			}

			TemporarySessionEntity session = sessionOpt.get();

			// Verificar que es el test inicial
			Optional<TestEntity> testOpt = testRepository.findByCode(INITIAL_TEST_CODE);
			if (!testOpt.isPresent()) {
				Map<String, Object> error = new HashMap<>();
				error.put("error", "Test inicial no encontrado");
				return ResponseEntity.status(404).body(error);
			}

			TestEntity test = testOpt.get();

			// Guardar respuestas
			for (SubmitItem it : req.answers) {
				if (it.questionId == null) {
					continue;
				}
				
				Optional<QuestionEntity> questionOpt = questionRepository.findById(it.questionId);
				if (!questionOpt.isPresent()) {
					continue;
				}
				
				QuestionEntity q = questionOpt.get();
				// Verificar que la pregunta pertenece al test inicial
				if (!q.getTest().getId().equals(test.getId())) {
					continue;
				}

				// Eliminar respuesta anterior si existe
				userAnswerRepository.findBySession(session).stream()
						.filter(ua -> ua.getQuestion().getId().equals(q.getId()))
						.forEach(userAnswerRepository::delete);

				UserAnswerEntity ua = new UserAnswerEntity();
				ua.setSession(session);
				ua.setQuestion(q);
				if (it.answerId != null) {
					Optional<AnswerEntity> answerOpt = answerRepository.findById(it.answerId);
					if (answerOpt.isPresent()) {
						ua.setAnswer(answerOpt.get());
					}
				}
				if (it.numericValue != null) {
					ua.setNumericValue(it.numericValue);
				}
				userAnswerRepository.save(ua);
			}

			// Marcar test inicial como completado
			sessionService.markInitialTestCompleted(sessionId);

			Map<String, Object> response = new HashMap<>();
			response.put("success", true);
			response.put("message", "Test inicial completado. Ahora puedes crear tu cuenta.");
			return ResponseEntity.ok(response);
		} catch (Exception e) {
			Map<String, Object> error = new HashMap<>();
			error.put("error", "Error al procesar las respuestas: " + e.getMessage());
			return ResponseEntity.status(500).body(error);
		}
	}

	public static class SubmitItem {
		public Long questionId;
		public Long answerId;
		public Double numericValue;
	}

	public static class SubmitRequest {
		public List<SubmitItem> answers;
	}
}

