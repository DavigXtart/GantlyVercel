package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.EvaluationTestEntity;
import com.alvaro.psicoapp.domain.EvaluationTestResultEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.EvaluationTestRepository;
import com.alvaro.psicoapp.repository.EvaluationTestResultRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
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
    private EvaluationTestResultRepository resultRepository;
    
    @Autowired
    private UserRepository userRepository;

    public List<EvaluationTestEntity> getTestsByCategory(String category) {
        return evaluationTestRepository.findByCategoryAndActiveTrue(category);
    }

    public List<EvaluationTestEntity> getTestsByTopic(String category, String topic) {
        return evaluationTestRepository.findByCategoryAndTopicAndActiveTrue(category, topic);
    }

    public List<EvaluationTestEntity> getAllActiveTests() {
        return evaluationTestRepository.findByActiveTrue();
    }

    public Optional<EvaluationTestEntity> getTestByCode(String code) {
        return evaluationTestRepository.findByCode(code);
    }

    @Transactional
    public EvaluationTestResultEntity saveResult(Long userId, Long testId, Map<String, Object> data) {
        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        EvaluationTestEntity test = evaluationTestRepository.findById(testId)
            .orElseThrow(() -> new RuntimeException("Test no encontrado"));

        EvaluationTestResultEntity result = new EvaluationTestResultEntity();
        result.setUser(user);
        result.setTest(test);
        
        if (data.get("sessionId") != null) {
            result.setSessionId(data.get("sessionId").toString());
        }
        if (data.get("score") != null) {
            result.setScore(new BigDecimal(data.get("score").toString()));
        }
        if (data.get("level") != null) {
            result.setLevel(data.get("level").toString());
        }
        if (data.get("answers") != null) {
            result.setAnswers(data.get("answers").toString());
        }

        return resultRepository.save(result);
    }

    public List<EvaluationTestResultEntity> getUserResults(Long userId) {
        return resultRepository.findByUser_IdOrderByCompletedAtDesc(userId);
    }

    public List<EvaluationTestResultEntity> getUserResultsByTest(Long userId, Long testId) {
        return resultRepository.findByUser_IdAndTest_IdOrderByCompletedAtDesc(userId, testId);
    }

    public Map<String, Object> getUserStatistics(Long userId) {
        List<EvaluationTestResultEntity> results = getUserResults(userId);
        
        Map<String, Object> stats = new HashMap<>();
        
        if (results.isEmpty()) {
            stats.put("totalTests", 0);
            stats.put("averageScore", 0.0);
            stats.put("testsByTopic", new HashMap<>());
            stats.put("recentResults", List.of());
            return stats;
        }

        double averageScore = results.stream()
            .filter(r -> r.getScore() != null)
            .mapToDouble(r -> r.getScore().doubleValue())
            .average()
            .orElse(0.0);

        Map<String, Long> testsByTopic = results.stream()
            .collect(Collectors.groupingBy(
                r -> r.getTest().getTopic(),
                Collectors.counting()
            ));

        List<Map<String, Object>> recentResults = results.stream()
            .limit(10)
            .map(r -> {
                Map<String, Object> resultMap = new HashMap<>();
                resultMap.put("testTitle", r.getTest().getTitle());
                resultMap.put("topic", r.getTest().getTopic());
                resultMap.put("score", r.getScore() != null ? r.getScore().doubleValue() : 0.0);
                resultMap.put("level", r.getLevel() != null ? r.getLevel() : "N/A");
                resultMap.put("completedAt", r.getCompletedAt().toString());
                return resultMap;
            })
            .collect(Collectors.toList());

        stats.put("totalTests", results.size());
        stats.put("averageScore", averageScore);
        stats.put("testsByTopic", testsByTopic);
        stats.put("recentResults", recentResults);
        
        return stats;
    }
}

