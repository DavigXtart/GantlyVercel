package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.AnswerEntity;
import com.alvaro.psicoapp.domain.QuestionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnswerRepository extends JpaRepository<AnswerEntity, Long> {
	List<AnswerEntity> findByQuestionOrderByPositionAsc(QuestionEntity question);
}