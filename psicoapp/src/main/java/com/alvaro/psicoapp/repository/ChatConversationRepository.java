package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.ChatConversationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatConversationRepository extends JpaRepository<ChatConversationEntity, Long> {
    Optional<ChatConversationEntity> findByPsychologistIdAndUserId(Long psychologistId, Long userId);

    List<ChatConversationEntity> findByUserId(Long userId);

    void deleteByUserId(Long userId);
}
