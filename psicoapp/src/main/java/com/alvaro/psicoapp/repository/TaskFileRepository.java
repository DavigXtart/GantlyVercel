package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.TaskFileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskFileRepository extends JpaRepository<TaskFileEntity, Long> { }


