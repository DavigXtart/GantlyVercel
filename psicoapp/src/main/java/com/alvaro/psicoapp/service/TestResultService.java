package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.dto.TestResultDtos;
import com.alvaro.psicoapp.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.alvaro.psicoapp.util.FormulaEvaluator;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TestResultService {
	private final UserAnswerRepository userAnswerRepository;
	private final UserRepository userRepository;
	private final TestRepository testRepository;
	private final TestResultRepository testResultRepository;
	private final FactorResultRepository factorResultRepository;
	private final SubfactorRepository subfactorRepository;
	private final FactorRepository factorRepository;
	private final QuestionRepository questionRepository;
	private final AnswerRepository answerRepository;
	private final UserPsychologistRepository userPsychologistRepository;
	private final AuditService auditService;

	public TestResultService(
			UserAnswerRepository userAnswerRepository,
			UserRepository userRepository,
			TestRepository testRepository,
			TestResultRepository testResultRepository,
			FactorResultRepository factorResultRepository,
			SubfactorRepository subfactorRepository,
			FactorRepository factorRepository,
			QuestionRepository questionRepository,
			AnswerRepository answerRepository,
			UserPsychologistRepository userPsychologistRepository,
			AuditService auditService) {
		this.userAnswerRepository = userAnswerRepository;
		this.userRepository = userRepository;
		this.testRepository = testRepository;
		this.testResultRepository = testResultRepository;
		this.factorResultRepository = factorResultRepository;
		this.subfactorRepository = subfactorRepository;
		this.factorRepository = factorRepository;
		this.questionRepository = questionRepository;
		this.answerRepository = answerRepository;
		this.userPsychologistRepository = userPsychologistRepository;
		this.auditService = auditService;
	}

	@Transactional
	public void calculateAndSaveResults(UserEntity user, TemporarySessionEntity session, TestEntity test) {

		List<UserAnswerEntity> userAnswers;
		if (user != null) {
			userAnswers = userAnswerRepository.findByUser(user).stream()
					.filter(ua -> ua.getQuestion().getTest().getId().equals(test.getId()))
					.collect(Collectors.toList());
		} else if (session != null) {
			userAnswers = userAnswerRepository.findBySession(session).stream()
					.filter(ua -> ua.getQuestion().getTest().getId().equals(test.getId()))
					.collect(Collectors.toList());
		} else {
			throw new IllegalArgumentException("Debe proporcionar usuario o sesión");
		}

		if (userAnswers.isEmpty()) {
			return;
		}

		if (user == null) {
			return;
		}

		boolean useGaussian = "tca".equalsIgnoreCase(test.getCategory());

		List<SubfactorEntity> subfactors = subfactorRepository.findByTestOrderByPositionAsc(test);

		Map<Long, TestResultEntity> subfactorResults = new HashMap<>();
		for (SubfactorEntity subfactor : subfactors) {

			List<QuestionEntity> subfactorQuestions = questionRepository.findByTestAndSubfactor(test, subfactor);

			double totalScore = 0.0;
			double maxScore = 0.0;

			for (QuestionEntity question : subfactorQuestions) {

				Optional<UserAnswerEntity> userAnswer = userAnswers.stream()
						.filter(ua -> ua.getQuestion().getId().equals(question.getId()))
						.findFirst();

				List<AnswerEntity> answers = answerRepository.findByQuestionOrderByPositionAsc(question);
				double questionMaxScore = answers.stream()
						.mapToDouble(a -> a.getValue() != null ? a.getValue().doubleValue() : 0.0)
						.max()
						.orElse(0.0);
				maxScore += questionMaxScore;

				if (userAnswer.isPresent()) {
					UserAnswerEntity ua = userAnswer.get();
					double score = 0.0;

					if (ua.getAnswer() != null && ua.getAnswer().getValue() != null) {
						score = ua.getAnswer().getValue().doubleValue();
					} else if (ua.getNumericValue() != null) {
						score = ua.getNumericValue();
					}

					// Items inversos: invertir la puntuación
					if (Boolean.TRUE.equals(question.getInverse()) && questionMaxScore > 0) {
						score = questionMaxScore - score;
					}

					totalScore += score;
				}
			}

			if (maxScore > 0) {
				double percentage = useGaussian
						? FormulaEvaluator.gaussianPercentile(totalScore, maxScore)
						: (totalScore / maxScore) * 100.0;

				List<TestResultEntity> existingResults = testResultRepository.findByUserAndTest(user, test);
				for (TestResultEntity existing : existingResults) {
					if (existing.getSubfactor() != null && existing.getSubfactor().getId().equals(subfactor.getId())) {
						testResultRepository.delete(existing);
					}
				}

				testResultRepository.flush();

				TestResultEntity result = new TestResultEntity();
				result.setUser(user);
				result.setTest(test);
				result.setSubfactor(subfactor);
				result.setScore(totalScore);
				result.setMaxScore(maxScore);
				result.setPercentage(percentage);
				testResultRepository.save(result);
				subfactorResults.put(subfactor.getId(), result);
			}
		}

		// Build subfactor scores by code for formula evaluation
		Map<String, double[]> subfactorScoresByCode = new HashMap<>();
		for (SubfactorEntity sf : subfactors) {
			TestResultEntity r = subfactorResults.get(sf.getId());
			if (r != null) {
				subfactorScoresByCode.put(sf.getCode(), new double[]{r.getScore(), r.getMaxScore()});
			}
		}
		Set<String> allSubfactorCodes = subfactors.stream()
				.map(SubfactorEntity::getCode).collect(Collectors.toSet());

		// Two-pass factor evaluation:
		// Pass 1: factors whose formulas only reference subfactors
		// Pass 2: factors whose formulas reference other factors (e.g. IG = INV + IV)
		List<FactorEntity> factors = factorRepository.findByTestOrderByPositionAsc(test);
		Map<String, double[]> factorScoresByCode = new HashMap<>();

		List<FactorEntity> pass1 = new ArrayList<>();
		List<FactorEntity> pass2 = new ArrayList<>();
		for (FactorEntity factor : factors) {
			String formula = factor.getFormula();
			if (formula != null && !formula.isBlank()
					&& FormulaEvaluator.referencesFactors(formula, allSubfactorCodes)) {
				pass2.add(factor);
			} else {
				pass1.add(factor);
			}
		}

		// Delete existing factor results once
		factorResultRepository.findByUserAndTest(user, test).forEach(factorResultRepository::delete);
		factorResultRepository.flush();

		for (FactorEntity factor : pass1) {
			evaluateAndSaveFactor(factor, user, test, subfactorScoresByCode, factorScoresByCode, allSubfactorCodes, useGaussian);
		}
		for (FactorEntity factor : pass2) {
			evaluateAndSaveFactor(factor, user, test, subfactorScoresByCode, factorScoresByCode, allSubfactorCodes, useGaussian);
		}
	}

	private void evaluateAndSaveFactor(FactorEntity factor, UserEntity user, TestEntity test,
									   Map<String, double[]> subfactorScoresByCode,
									   Map<String, double[]> factorScoresByCode,
									   Set<String> allSubfactorCodes,
									   boolean useGaussian) {
		double totalScore;
		double totalMax;
		String formula = factor.getFormula();

		if (formula != null && !formula.isBlank()) {
			// Formula-based evaluation
			double[] result = FormulaEvaluator.evaluate(formula, subfactorScoresByCode, factorScoresByCode, factor.getCode());
			if (result == null) return;
			totalScore = result[0];
			totalMax = result[1];
		} else {
			// Fallback: simple sum of child subfactors (backwards compat for factors without formula)
			List<SubfactorEntity> factorSubfactors = subfactorRepository.findByFactorId(factor.getId());
			totalScore = 0.0;
			totalMax = 0.0;
			for (SubfactorEntity sf : factorSubfactors) {
				double[] scores = subfactorScoresByCode.get(sf.getCode());
				if (scores != null) {
					totalScore += scores[0];
					totalMax += scores[1];
				}
			}
			if (totalMax <= 0) return;
		}

		double percentage = useGaussian
				? FormulaEvaluator.gaussianPercentile(totalScore, totalMax)
				: (totalScore / totalMax) * 100.0;
		factorScoresByCode.put(factor.getCode(), new double[]{totalScore, totalMax});

		FactorResultEntity factorResult = new FactorResultEntity();
		factorResult.setUser(user);
		factorResult.setTest(test);
		factorResult.setFactor(factor);
		factorResult.setScore(totalScore);
		factorResult.setMaxScore(totalMax);
		factorResult.setPercentage(percentage);
		factorResultRepository.save(factorResult);
	}

	@Transactional
	public void transferSessionAnswersToUser(TemporarySessionEntity session, UserEntity user) {
		List<UserAnswerEntity> sessionAnswers = userAnswerRepository.findBySession(session);

		for (UserAnswerEntity sessionAnswer : sessionAnswers) {

			Optional<UserAnswerEntity> existingAnswer = userAnswerRepository.findByUser(user).stream()
					.filter(ua -> ua.getQuestion().getId().equals(sessionAnswer.getQuestion().getId()))
					.findFirst();

			if (!existingAnswer.isPresent()) {

				UserAnswerEntity userAnswer = new UserAnswerEntity();
				userAnswer.setUser(user);
				userAnswer.setQuestion(sessionAnswer.getQuestion());
				userAnswer.setAnswer(sessionAnswer.getAnswer());
				userAnswer.setNumericValue(sessionAnswer.getNumericValue());
				userAnswer.setTextValue(sessionAnswer.getTextValue());
				userAnswerRepository.save(userAnswer);
			}
		}

		userAnswerRepository.deleteAll(sessionAnswers);
	}

	/**
	 * Extract profile fields from the user's INITIAL test answers.
	 * Called after transferring session answers to the user during registration.
	 */
	@Transactional
	public void extractProfileFromInitialTest(UserEntity user) {
		var testOpt = testRepository.findByCode("INITIAL");
		if (testOpt.isEmpty()) return;
		TestEntity test = testOpt.get();
		List<UserAnswerEntity> answers = userAnswerRepository.findByUser(user).stream()
				.filter(ua -> ua.getQuestion().getTest().getId().equals(test.getId()))
				.collect(Collectors.toList());
		boolean changed = false;

		// Collect multi-answer fields
		List<String> languages = new ArrayList<>();
		List<String> schedules = new ArrayList<>();

		for (UserAnswerEntity ua : answers) {
			int pos = ua.getQuestion().getPosition();
			String answerText = ua.getAnswer() != null ? ua.getAnswer().getText() : null;

			// Position 1: chief complaint
			if (pos == 1 && answerText != null && user.getChiefComplaint() == null) {
				user.setChiefComplaint(answerText);
				changed = true;
			}
			// Position 2: preferred psychologist gender
			if (pos == 2 && answerText != null && user.getPreferredPsychGender() == null) {
				user.setPreferredPsychGender(answerText);
				changed = true;
			}
			// Position 10: availability (MULTI — collect all)
			if (pos == 10 && answerText != null) {
				schedules.add(answerText);
			}
			// Position 12: budget
			if (pos == 12 && answerText != null && user.getPreferredBudget() == null) {
				user.setPreferredBudget(answerText);
				changed = true;
			}
			// Position 13: urgency
			if (pos == 13 && answerText != null && user.getTherapyUrgency() == null) {
				user.setTherapyUrgency(answerText);
				changed = true;
			}
			// Position 14: age (numeric)
			if (pos == 14 && ua.getNumericValue() != null && user.getAge() == null) {
				user.setAge(ua.getNumericValue().intValue());
				changed = true;
			}
			// Position 15: language preference (MULTI — collect all)
			if (pos == 15 && answerText != null) {
				languages.add(answerText);
			}
		}

		if (!schedules.isEmpty() && user.getPreferredSchedule() == null) {
			user.setPreferredSchedule(String.join(", ", schedules));
			changed = true;
		}
		if (!languages.isEmpty() && user.getPreferredLanguage() == null) {
			user.setPreferredLanguage(String.join(", ", languages));
			changed = true;
		}

		if (changed) {
			userRepository.save(user);
		}
	}

	@Transactional(readOnly = true)
	public TestResultDtos.MyResultsResponse getMyResults(UserEntity user) {
		List<TestResultEntity> subfactorResults = testResultRepository.findByUser(user);
		List<FactorResultEntity> factorResults = factorResultRepository.findByUser(user);
		Map<Long, List<TestResultDtos.SubfactorResultDto>> subfactorsByTest = new HashMap<>();
		Map<Long, List<TestResultDtos.FactorResultDto>> factorsByTest = new HashMap<>();
		Map<Long, String> testTitles = new HashMap<>();
		for (TestResultEntity result : subfactorResults) {
			Long testId = result.getTest().getId();
			subfactorsByTest.putIfAbsent(testId, new ArrayList<>());
			subfactorsByTest.get(testId).add(new TestResultDtos.SubfactorResultDto(
					result.getSubfactor().getCode(), result.getSubfactor().getName(),
					result.getScore(), result.getMaxScore(), result.getPercentage(),
					result.getSubfactor().getMinLabel(), result.getSubfactor().getMaxLabel(),
					result.getSubfactor().getCutoffs()));
			testTitles.put(testId, result.getTest().getTitle());
		}
		for (FactorResultEntity result : factorResults) {
			Long testId = result.getTest().getId();
			factorsByTest.putIfAbsent(testId, new ArrayList<>());
			factorsByTest.get(testId).add(new TestResultDtos.FactorResultDto(
					result.getFactor().getCode(), result.getFactor().getName(),
					result.getScore(), result.getMaxScore(), result.getPercentage(),
					result.getFactor().getMinLabel(), result.getFactor().getMaxLabel()));
		}
		Set<Long> allTestIds = new HashSet<>();
		allTestIds.addAll(subfactorsByTest.keySet());
		allTestIds.addAll(factorsByTest.keySet());
		List<TestResultDtos.TestResultItemDto> results = allTestIds.stream()
			 .map(testId -> new TestResultDtos.TestResultItemDto(testId, testTitles.getOrDefault(testId, ""),
					 subfactorsByTest.getOrDefault(testId, List.of()),
					 factorsByTest.getOrDefault(testId, List.of())))
			 .collect(Collectors.toList());
		return new TestResultDtos.MyResultsResponse(results);
	}

	@Transactional(readOnly = true)
	public TestResultDtos.TestResultsResponse getTestResults(UserEntity user, Long testId) {
		TestEntity test = testRepository.findById(testId).orElseThrow();
		List<TestResultEntity> subfactorResults = testResultRepository.findByUserAndTest(user, test);
		List<FactorResultEntity> factorResults = factorResultRepository.findByUserAndTest(user, test);
		var subfactors = subfactorResults.stream()
				.map(r -> new TestResultDtos.SubfactorResultDto(r.getSubfactor().getCode(), r.getSubfactor().getName(),
						r.getScore(), r.getMaxScore(), r.getPercentage(),
						r.getSubfactor().getMinLabel(), r.getSubfactor().getMaxLabel(),
						r.getSubfactor().getCutoffs()))
				.collect(Collectors.toList());
		var factors = factorResults.stream()
				.map(r -> new TestResultDtos.FactorResultDto(r.getFactor().getCode(), r.getFactor().getName(),
						r.getScore(), r.getMaxScore(), r.getPercentage(),
						r.getFactor().getMinLabel(), r.getFactor().getMaxLabel()))
				.collect(Collectors.toList());
		return new TestResultDtos.TestResultsResponse(test.getId(), test.getTitle(), subfactors, factors);
	}

	@Transactional(readOnly = true)
	public TestResultDtos.UserTestResultsResponse getUserTestResults(UserEntity requester, Long userId, Long testId) {

		if (!RoleConstants.PSYCHOLOGIST.equals(requester.getRole())) {
			auditService.logUnauthorizedAccess(requester.getId(), requester.getRole(), userId, "TEST_RESULTS", "Requester is not a psychologist");
			throw new org.springframework.web.server.ResponseStatusException(
				org.springframework.http.HttpStatus.FORBIDDEN,
				"Solo psicólogos pueden ver resultados de pacientes"
			);
		}

		var rel = userPsychologistRepository.findByUserId(userId);
		if (rel.isEmpty() || !rel.get().getPsychologist().getId().equals(requester.getId())) {
			auditService.logUnauthorizedAccess(requester.getId(), requester.getRole(), userId, "TEST_RESULTS", "Patient not assigned to psychologist");
			throw new org.springframework.web.server.ResponseStatusException(
				org.springframework.http.HttpStatus.FORBIDDEN,
				"Este usuario no es tu paciente"
			);
		}

		auditService.logPatientDataAccess(requester.getId(), userId, "TEST_RESULTS", "READ");

		UserEntity user = userRepository.findById(userId).orElseThrow();
		TestEntity test = testRepository.findById(testId).orElseThrow();
		List<TestResultEntity> subfactorResults = testResultRepository.findByUserAndTest(user, test);
		List<FactorResultEntity> factorResults = factorResultRepository.findByUserAndTest(user, test);
		var subfactors = subfactorResults.stream().map(r -> new TestResultDtos.SubfactorResultDetailDto(
				r.getSubfactor().getId(), r.getSubfactor().getCode(), r.getSubfactor().getName(),
				r.getScore(), r.getMaxScore(), r.getPercentage(),
				r.getSubfactor().getMinLabel(), r.getSubfactor().getMaxLabel(),
				r.getSubfactor().getCutoffs())).collect(Collectors.toList());
		var factors = factorResults.stream().map(r -> new TestResultDtos.FactorResultDetailDto(
				r.getFactor().getId(), r.getFactor().getCode(), r.getFactor().getName(),
				r.getScore(), r.getMaxScore(), r.getPercentage(),
				r.getFactor().getMinLabel(), r.getFactor().getMaxLabel())).collect(Collectors.toList());
		return new TestResultDtos.UserTestResultsResponse(user.getId(), user.getEmail(), test.getId(), test.getTitle(), subfactors, factors);
	}
}
