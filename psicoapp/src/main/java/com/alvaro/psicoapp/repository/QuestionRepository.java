package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.QuestionEntity;
import com.alvaro.psicoapp.domain.TestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuestionRepository extends JpaRepository<QuestionEntity, Long> {
	List<QuestionEntity> findByTestOrderByPositionAsc(TestEntity test);
}