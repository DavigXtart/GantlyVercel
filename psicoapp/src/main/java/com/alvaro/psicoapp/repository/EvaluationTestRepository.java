package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.EvaluationTestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EvaluationTestRepository extends JpaRepository<EvaluationTestEntity, Long> {
    Optional<EvaluationTestEntity> findByCode(String code);
    List<EvaluationTestEntity> findByCategoryAndActiveTrue(String category);
    List<EvaluationTestEntity> findByCategoryAndTopicAndActiveTrue(String category, String topic);
    List<EvaluationTestEntity> findByActiveTrue();
}

