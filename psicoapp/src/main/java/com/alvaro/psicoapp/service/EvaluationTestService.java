package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.EvaluationTestEntity;
import com.alvaro.psicoapp.domain.EvaluationTestResultEntity;
import com.alvaro.psicoapp.domain.TestEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.EvaluationTestRepository;
import com.alvaro.psicoapp.repository.EvaluationTestResultRepository;
import com.alvaro.psicoapp.repository.TestRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EvaluationTestService {
    @Autowired
    private EvaluationTestRepository evaluationTestRepository;
    
    @Autowired
    private TestRepository testRepository;
    
    @Autowired
    private EvaluationTestResultRepository resultRepository;
    
    @Autowired
    private UserRepository userRepository;

    public List<EvaluationTestEntity> getTestsByCategory(String category) {
        List<EvaluationTestEntity> evaluationTests = evaluationTestRepository.findByCategoryAndActiveTrue(category);
        
        // También incluir tests de la tabla tests que tengan esta categoría
        List<TestEntity> testsWithCategory = testRepository.findAll().stream()
            .filter(t -> t.getActive() != null && t.getActive() 
                && t.getCategory() != null && t.getCategory().equals(category))
            .collect(Collectors.toList());
        
        // Convertir TestEntity a EvaluationTestEntity para mantener compatibilidad
        List<EvaluationTestEntity> convertedTests = testsWithCategory.stream()
            .map(this::convertTestToEvaluationTest)
            .collect(Collectors.toList());
        
        // Combinar ambas listas
        List<EvaluationTestEntity> allTests = new ArrayList<>(evaluationTests);
        allTests.addAll(convertedTests);
        
        return allTests;
    }
    
    private EvaluationTestEntity convertTestToEvaluationTest(TestEntity test) {
        EvaluationTestEntity evalTest = new EvaluationTestEntity();
        evalTest.setId(test.getId());
        evalTest.setCode(test.getCode());
        evalTest.setTitle(test.getTitle());
        evalTest.setDescription(test.getDescription());
        evalTest.setCategory(test.getCategory());
        evalTest.setTopic(test.getTopic());
        evalTest.setActive(test.getActive());
        evalTest.setCreatedAt(test.getCreatedAt());
        return evalTest;
    }

    public List<EvaluationTestEntity> getTestsByTopic(String category, String topic) {
        List<EvaluationTestEntity> evaluationTests = evaluationTestRepository.findByCategoryAndTopicAndActiveTrue(category, topic);
        
        // También incluir tests de la tabla tests que tengan esta categoría y topic
        List<TestEntity> testsWithCategoryAndTopic = testRepository.findAll().stream()
            .filter(t -> t.getActive() != null && t.getActive() 
                && t.getCategory() != null && t.getCategory().equals(category)
                && t.getTopic() != null && t.getTopic().equals(topic))
            .collect(Collectors.toList());
        
        // Convertir TestEntity a EvaluationTestEntity
        List<EvaluationTestEntity> convertedTests = testsWithCategoryAndTopic.stream()
            .map(this::convertTestToEvaluationTest)
            .collect(Collectors.toList());
        
        // Combinar ambas listas
        List<EvaluationTestEntity> allTests = new ArrayList<>(evaluationTests);
        allTests.addAll(convertedTests);
        
        return allTests;
    }

    public List<EvaluationTestEntity> getAllActiveTests() {
        return evaluationTestRepository.findByActiveTrue();
    }

    public Optional<EvaluationTestEntity> getTestByCode(String code) {
        return evaluationTestRepository.findByCode(code);
    }

    @Transactional
    public EvaluationTestResultEntity saveResult(Long userId, Long testId, com.alvaro.psicoapp.dto.EvaluationTestDtos.SubmitResultRequest data) {
        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        EvaluationTestEntity test = evaluationTestRepository.findById(testId)
            .orElseThrow(() -> new RuntimeException("Test no encontrado"));
        EvaluationTestResultEntity result = new EvaluationTestResultEntity();
        result.setUser(user);
        result.setTest(test);
        if (data.sessionId() != null) result.setSessionId(data.sessionId());
        if (data.score() != null) result.setScore(data.score());
        if (data.level() != null) result.setLevel(data.level());
        if (data.answers() != null) result.setAnswers(com.alvaro.psicoapp.util.InputSanitizer.sanitize(data.answers()));
        return resultRepository.save(result);
    }

    public List<EvaluationTestResultEntity> getUserResults(Long userId) {
        return resultRepository.findByUser_IdOrderByCompletedAtDesc(userId);
    }

    public List<EvaluationTestResultEntity> getUserResultsByTest(Long userId, Long testId) {
        return resultRepository.findByUser_IdAndTest_IdOrderByCompletedAtDesc(userId, testId);
    }

    public com.alvaro.psicoapp.dto.EvaluationTestDtos.UserStatisticsResponse getUserStatistics(Long userId) {
        List<EvaluationTestResultEntity> results = getUserResults(userId);
        if (results.isEmpty()) {
            return new com.alvaro.psicoapp.dto.EvaluationTestDtos.UserStatisticsResponse(0, 0.0, Map.of(), List.of());
        }
        double averageScore = results.stream()
            .filter(r -> r.getScore() != null)
            .mapToDouble(r -> r.getScore().doubleValue())
            .average()
            .orElse(0.0);
        Map<String, Long> testsByTopic = results.stream()
            .collect(Collectors.groupingBy(r -> r.getTest().getTopic(), Collectors.counting()));
        var recentResults = results.stream().limit(10)
            .map(r -> new com.alvaro.psicoapp.dto.EvaluationTestDtos.RecentResultDto(
                    r.getTest().getTitle(), r.getTest().getTopic(),
                    r.getScore() != null ? r.getScore().doubleValue() : 0.0,
                    r.getLevel() != null ? r.getLevel() : "N/A",
                    r.getCompletedAt().toString()))
            .collect(Collectors.toList());
        return new com.alvaro.psicoapp.dto.EvaluationTestDtos.UserStatisticsResponse(
                results.size(), averageScore, testsByTopic, recentResults);
    }
}

