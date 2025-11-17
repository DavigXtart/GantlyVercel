package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.TaskCommentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskCommentRepository extends JpaRepository<TaskCommentEntity, Long> {
    List<TaskCommentEntity> findByTask_IdOrderByCreatedAtAsc(Long taskId);
}

