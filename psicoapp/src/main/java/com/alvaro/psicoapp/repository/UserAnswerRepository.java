package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.UserAnswerEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.domain.QuestionEntity;
import com.alvaro.psicoapp.domain.TemporarySessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserAnswerRepository extends JpaRepository<UserAnswerEntity, Long> {
	List<UserAnswerEntity> findByUser(UserEntity user);
	List<UserAnswerEntity> findByQuestion(QuestionEntity question);
	List<UserAnswerEntity> findByUserOrderByCreatedAtDesc(UserEntity user);
	List<UserAnswerEntity> findBySession(TemporarySessionEntity session);
}
