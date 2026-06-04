package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.TaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<TaskEntity, Long> {
    List<TaskEntity> findByUser_IdOrderByCreatedAtDesc(Long userId);
    List<TaskEntity> findByPsychologist_IdOrderByCreatedAtDesc(Long psychologistId);
    List<TaskEntity> findByUser_IdAndPsychologist_IdOrderByCreatedAtDesc(Long userId, Long psychologistId);
    long deleteByUser_Id(Long userId);
    long deleteByPsychologist_Id(Long psychologistId);
}
