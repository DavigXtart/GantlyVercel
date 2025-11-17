package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.AssignedTestEntity;
import com.alvaro.psicoapp.domain.TestEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignedTestRepository extends JpaRepository<AssignedTestEntity, Long> {
    List<AssignedTestEntity> findByUser_IdOrderByAssignedAtDesc(Long userId);
    List<AssignedTestEntity> findByPsychologist_IdOrderByAssignedAtDesc(Long psychologistId);
    List<AssignedTestEntity> findByUser_IdAndCompletedAtIsNullOrderByAssignedAtDesc(Long userId);
    Optional<AssignedTestEntity> findByUserAndTest(UserEntity user, TestEntity test);
}

