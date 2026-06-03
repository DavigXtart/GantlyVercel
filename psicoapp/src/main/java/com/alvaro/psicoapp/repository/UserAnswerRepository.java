package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.UserAnswerEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.domain.QuestionEntity;
import com.alvaro.psicoapp.domain.TemporarySessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import java.util.List;

public interface UserAnswerRepository extends JpaRepository<UserAnswerEntity, Long> {
	List<UserAnswerEntity> findByUser(UserEntity user);
	List<UserAnswerEntity> findByQuestion(QuestionEntity question);
	List<UserAnswerEntity> findByUserOrderByCreatedAtDesc(UserEntity user);
	List<UserAnswerEntity> findBySession(TemporarySessionEntity session);
    long deleteByUser_Id(Long userId);

    @Query("SELECT ua FROM UserAnswerEntity ua WHERE ua.question.id IN :questionIds")
    List<UserAnswerEntity> findByQuestionIdIn(@Param("questionIds") Collection<Long> questionIds);

    @Query("SELECT ua FROM UserAnswerEntity ua WHERE ua.user.id IN :userIds")
    List<UserAnswerEntity> findByUserIdIn(@Param("userIds") Collection<Long> userIds);
}
