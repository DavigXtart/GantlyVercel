package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.AssignedTestEntity;
import com.alvaro.psicoapp.domain.TestEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignedTestRepository extends JpaRepository<AssignedTestEntity, Long> {
    List<AssignedTestEntity> findByUser_IdOrderByAssignedAtDesc(Long userId);
    List<AssignedTestEntity> findByPsychologist_IdOrderByAssignedAtDesc(Long psychologistId);

    @Query("SELECT at FROM AssignedTestEntity at JOIN FETCH at.user JOIN FETCH at.psychologist LEFT JOIN FETCH at.test LEFT JOIN FETCH at.evaluationTest WHERE at.user.id = :userId ORDER BY at.assignedAt DESC")
    List<AssignedTestEntity> findByUserIdWithRelations(@Param("userId") Long userId);

    @Query("SELECT at FROM AssignedTestEntity at JOIN FETCH at.user JOIN FETCH at.psychologist LEFT JOIN FETCH at.test LEFT JOIN FETCH at.evaluationTest WHERE at.psychologist.id = :psychId ORDER BY at.assignedAt DESC")
    List<AssignedTestEntity> findByPsychologistIdWithRelations(@Param("psychId") Long psychId);
    List<AssignedTestEntity> findByUser_IdAndCompletedAtIsNullOrderByAssignedAtDesc(Long userId);
    Optional<AssignedTestEntity> findByUserAndTest(UserEntity user, TestEntity test);
    Optional<AssignedTestEntity> findByUser_IdAndEvaluationTest_Id(Long userId, Long evaluationTestId);
    long deleteByUser_Id(Long userId);
    long deleteByPsychologist_Id(Long psychologistId);
}
