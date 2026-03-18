package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.dto.TestResultDtos;
import com.alvaro.psicoapp.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
				double percentage = (totalScore / maxScore) * 100.0;

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

		List<FactorEntity> factors = factorRepository.findByTestOrderByPositionAsc(test);
		for (FactorEntity factor : factors) {

			List<SubfactorEntity> factorSubfactors = subfactorRepository.findByFactorId(factor.getId());

			double totalFactorScore = 0.0;
			double totalFactorMaxScore = 0.0;

			for (SubfactorEntity subfactor : factorSubfactors) {
				TestResultEntity subfactorResult = subfactorResults.get(subfactor.getId());
				if (subfactorResult != null) {
					totalFactorScore += subfactorResult.getScore();
					totalFactorMaxScore += subfactorResult.getMaxScore();
				}
			}

			if (totalFactorMaxScore > 0) {
				double percentage = (totalFactorScore / totalFactorMaxScore) * 100.0;

				factorResultRepository.findByUserAndTest(user, test).stream()
						.filter(fr -> fr.getFactor().getId().equals(factor.getId()))
						.forEach(factorResultRepository::delete);

				FactorResultEntity factorResult = new FactorResultEntity();
				factorResult.setUser(user);
				factorResult.setTest(test);
				factorResult.setFactor(factor);
				factorResult.setScore(totalFactorScore);
				factorResult.setMaxScore(totalFactorMaxScore);
				factorResult.setPercentage(percentage);
				factorResultRepository.save(factorResult);
			}
		}
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
					result.getSubfactor().getMinLabel(), result.getSubfactor().getMaxLabel()));
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
						r.getSubfactor().getMinLabel(), r.getSubfactor().getMaxLabel()))
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
				r.getSubfactor().getMinLabel(), r.getSubfactor().getMaxLabel())).collect(Collectors.toList());
		var factors = factorResults.stream().map(r -> new TestResultDtos.FactorResultDetailDto(
				r.getFactor().getId(), r.getFactor().getCode(), r.getFactor().getName(),
				r.getScore(), r.getMaxScore(), r.getPercentage(),
				r.getFactor().getMinLabel(), r.getFactor().getMaxLabel())).collect(Collectors.toList());
		return new TestResultDtos.UserTestResultsResponse(user.getId(), user.getEmail(), test.getId(), test.getTitle(), subfactors, factors);
	}
}
