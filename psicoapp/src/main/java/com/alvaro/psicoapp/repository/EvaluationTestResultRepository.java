package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.EvaluationTestResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface EvaluationTestResultRepository extends JpaRepository<EvaluationTestResultEntity, Long> {
    List<EvaluationTestResultEntity> findByUser_IdOrderByCompletedAtDesc(Long userId);
    List<EvaluationTestResultEntity> findByUser_IdAndTest_IdOrderByCompletedAtDesc(Long userId, Long testId);
    List<EvaluationTestResultEntity> findByUser_IdAndCompletedAtBetween(Long userId, Instant start, Instant end);
    Optional<EvaluationTestResultEntity> findByUser_IdAndTest_IdAndSessionId(Long userId, Long testId, String sessionId);
}

