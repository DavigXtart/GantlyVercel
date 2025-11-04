package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.repository.*;
import com.alvaro.psicoapp.service.TestResultService;
import com.alvaro.psicoapp.service.ExcelExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/results")
public class TestResultController {
	private final UserRepository userRepository;
	private final TestRepository testRepository;
	private final TestResultRepository testResultRepository;
	private final FactorResultRepository factorResultRepository;
	private final SubfactorRepository subfactorRepository;
	private final FactorRepository factorRepository;
	private final TestResultService testResultService;
	private final ExcelExportService excelExportService;

	public TestResultController(
			UserRepository userRepository,
			TestRepository testRepository,
			TestResultRepository testResultRepository,
			FactorResultRepository factorResultRepository,
			SubfactorRepository subfactorRepository,
			FactorRepository factorRepository,
			TestResultService testResultService,
			ExcelExportService excelExportService) {
		this.userRepository = userRepository;
		this.testRepository = testRepository;
		this.testResultRepository = testResultRepository;
		this.factorResultRepository = factorResultRepository;
		this.subfactorRepository = subfactorRepository;
		this.factorRepository = factorRepository;
		this.testResultService = testResultService;
		this.excelExportService = excelExportService;
	}

	/**
	 * Obtiene todos los resultados de un usuario
	 */
	@GetMapping("/my-results")
	public ResponseEntity<Map<String, Object>> getMyResults(Principal principal) {
		UserEntity user = userRepository.findByEmail(principal.getName()).orElseThrow();
		
		// Obtener resultados por subfactor
		List<TestResultEntity> subfactorResults = testResultRepository.findByUser(user);
		
		// Obtener resultados por factor
		List<FactorResultEntity> factorResults = factorResultRepository.findByUser(user);

		// Agrupar por test
		Map<Long, Map<String, Object>> testsData = new HashMap<>();
		
		// Procesar resultados de subfactores
		for (TestResultEntity result : subfactorResults) {
			Long testId = result.getTest().getId();
			testsData.putIfAbsent(testId, new HashMap<>());
			Map<String, Object> testData = testsData.get(testId);
			
			testData.put("testId", testId);
			testData.put("testTitle", result.getTest().getTitle());
			testData.putIfAbsent("subfactors", new ArrayList<>());
			
			@SuppressWarnings("unchecked")
			List<Map<String, Object>> subfactors = (List<Map<String, Object>>) testData.get("subfactors");
			
			Map<String, Object> subfactorData = new HashMap<>();
			subfactorData.put("code", result.getSubfactor().getCode());
			subfactorData.put("name", result.getSubfactor().getName());
			subfactorData.put("score", result.getScore());
			subfactorData.put("maxScore", result.getMaxScore());
			subfactorData.put("percentage", result.getPercentage());
			subfactors.add(subfactorData);
		}

		// Procesar resultados de factores
		for (FactorResultEntity result : factorResults) {
			Long testId = result.getTest().getId();
			Map<String, Object> testData = testsData.get(testId);
			if (testData != null) {
				testData.putIfAbsent("factors", new ArrayList<>());
				
				@SuppressWarnings("unchecked")
				List<Map<String, Object>> factors = (List<Map<String, Object>>) testData.get("factors");
				
				Map<String, Object> factorData = new HashMap<>();
				factorData.put("code", result.getFactor().getCode());
				factorData.put("name", result.getFactor().getName());
				factorData.put("score", result.getScore());
				factorData.put("maxScore", result.getMaxScore());
				factorData.put("percentage", result.getPercentage());
				factors.add(factorData);
			}
		}

		Map<String, Object> response = new HashMap<>();
		response.put("results", new ArrayList<>(testsData.values()));
		return ResponseEntity.ok(response);
	}

	/**
	 * Obtiene resultados detallados de un test específico
	 */
	@GetMapping("/test/{testId}")
	public ResponseEntity<Map<String, Object>> getTestResults(
			Principal principal,
			@PathVariable Long testId) {
		
		UserEntity user = userRepository.findByEmail(principal.getName()).orElseThrow();
		TestEntity test = testRepository.findById(testId).orElseThrow();

		// Obtener resultados de subfactores
		List<TestResultEntity> subfactorResults = testResultRepository.findByUserAndTest(user, test);
		
		// Obtener resultados de factores
		List<FactorResultEntity> factorResults = factorResultRepository.findByUserAndTest(user, test);

		// Construir respuesta
		Map<String, Object> response = new HashMap<>();
		response.put("testId", test.getId());
		response.put("testTitle", test.getTitle());
		
		// Resultados de subfactores
		List<Map<String, Object>> subfactors = subfactorResults.stream().map(r -> {
			Map<String, Object> data = new HashMap<>();
			data.put("code", r.getSubfactor().getCode());
			data.put("name", r.getSubfactor().getName());
			data.put("score", r.getScore());
			data.put("maxScore", r.getMaxScore());
			data.put("percentage", r.getPercentage());
			return data;
		}).collect(Collectors.toList());
		response.put("subfactors", subfactors);

		// Resultados de factores
		List<Map<String, Object>> factors = factorResults.stream().map(r -> {
			Map<String, Object> data = new HashMap<>();
			data.put("code", r.getFactor().getCode());
			data.put("name", r.getFactor().getName());
			data.put("score", r.getScore());
			data.put("maxScore", r.getMaxScore());
			data.put("percentage", r.getPercentage());
			return data;
		}).collect(Collectors.toList());
		response.put("factors", factors);

		return ResponseEntity.ok(response);
	}

	/**
	 * ADMIN: Obtiene resultados de un test para un usuario específico
	 */
	@GetMapping("/user/{userId}/test/{testId}")
	public ResponseEntity<Map<String, Object>> getUserTestResults(
			@PathVariable Long userId,
			@PathVariable Long testId) {

		UserEntity user = userRepository.findById(userId).orElseThrow();
		TestEntity test = testRepository.findById(testId).orElseThrow();

		List<TestResultEntity> subfactorResults = testResultRepository.findByUserAndTest(user, test);
		List<FactorResultEntity> factorResults = factorResultRepository.findByUserAndTest(user, test);

		Map<String, Object> response = new HashMap<>();
		response.put("userId", user.getId());
		response.put("userEmail", user.getEmail());
		response.put("testId", test.getId());
		response.put("testTitle", test.getTitle());

		List<Map<String, Object>> subfactors = subfactorResults.stream().map(r -> {
			Map<String, Object> data = new HashMap<>();
			data.put("subfactorId", r.getSubfactor().getId());
			data.put("subfactorCode", r.getSubfactor().getCode());
			data.put("subfactorName", r.getSubfactor().getName());
			data.put("score", r.getScore());
			data.put("maxScore", r.getMaxScore());
			data.put("percentage", r.getPercentage());
			return data;
		}).collect(Collectors.toList());
		response.put("subfactors", subfactors);

		List<Map<String, Object>> factors = factorResults.stream().map(r -> {
			Map<String, Object> data = new HashMap<>();
			data.put("factorId", r.getFactor().getId());
			data.put("factorCode", r.getFactor().getCode());
			data.put("factorName", r.getFactor().getName());
			data.put("score", r.getScore());
			data.put("maxScore", r.getMaxScore());
			data.put("percentage", r.getPercentage());
			return data;
		}).collect(Collectors.toList());
		response.put("factors", factors);

		return ResponseEntity.ok(response);
	}

	/**
	 * ADMIN: Exporta resultados de un test de un usuario específico a Excel
	 */
	@GetMapping("/user/{userId}/test/{testId}/export")
	public ResponseEntity<byte[]> exportUserTestResults(
			@PathVariable Long userId,
			@PathVariable Long testId) {
		try {
			byte[] excelBytes = excelExportService.exportTestResults(userId, testId);
			TestEntity test = testRepository.findById(testId).orElseThrow();
			UserEntity user = userRepository.findById(userId).orElseThrow();

			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
			headers.setContentDispositionFormData("attachment", "resultados_" + test.getCode() + "_" + user.getId() + ".xlsx");

			return ResponseEntity.ok()
					.headers(headers)
					.body(excelBytes);
		} catch (Exception e) {
			return ResponseEntity.internalServerError().build();
		}
	}

	/**
	 * ADMIN: Exporta todos los resultados de un usuario a Excel
	 */
	@GetMapping("/user/{userId}/export")
	public ResponseEntity<byte[]> exportUserAllResults(
			@PathVariable Long userId) {
		try {
			UserEntity user = userRepository.findById(userId).orElseThrow();
			byte[] excelBytes = excelExportService.exportUserResults(userId);

			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
			// Usar nombre completo del usuario, reemplazando espacios y caracteres especiales
			String safeName = user.getName().replaceAll("[^a-zA-Z0-9]", "_");
			headers.setContentDispositionFormData("attachment", "resultados_" + safeName + ".xlsx");

			return ResponseEntity.ok()
					.headers(headers)
					.body(excelBytes);
		} catch (Exception e) {
			return ResponseEntity.internalServerError().build();
		}
	}

	/**
	 * Recalcula resultados de un test para el usuario actual
	 */
	@PostMapping("/test/{testId}/recalculate")
	public ResponseEntity<Void> recalculateResults(
			Principal principal,
			@PathVariable Long testId) {
		
		UserEntity user = userRepository.findByEmail(principal.getName()).orElseThrow();
		TestEntity test = testRepository.findById(testId).orElseThrow();
		
		testResultService.calculateAndSaveResults(user, null, test);
		
		return ResponseEntity.ok().build();
	}

	/**
	 * Exporta todos los resultados del usuario a Excel
	 */
	@GetMapping("/export")
	public ResponseEntity<byte[]> exportMyResults(Principal principal) {
		try {
			UserEntity user = userRepository.findByEmail(principal.getName()).orElseThrow();
			byte[] excelBytes = excelExportService.exportUserResults(user.getId());
			
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
			headers.setContentDispositionFormData("attachment", "resultados_" + user.getEmail() + ".xlsx");
			
			return ResponseEntity.ok()
					.headers(headers)
					.body(excelBytes);
		} catch (Exception e) {
			return ResponseEntity.internalServerError().build();
		}
	}

	/**
	 * Exporta resultados de un test específico a Excel
	 */
	@GetMapping("/test/{testId}/export")
	public ResponseEntity<byte[]> exportTestResults(
			Principal principal,
			@PathVariable Long testId) {
		try {
			UserEntity user = userRepository.findByEmail(principal.getName()).orElseThrow();
			byte[] excelBytes = excelExportService.exportTestResults(user.getId(), testId);
			
			TestEntity test = testRepository.findById(testId).orElseThrow();
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
			headers.setContentDispositionFormData("attachment", "resultados_" + test.getCode() + ".xlsx");
			
			return ResponseEntity.ok()
					.headers(headers)
					.body(excelBytes);
		} catch (Exception e) {
			return ResponseEntity.internalServerError().build();
		}
	}
}

