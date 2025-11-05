package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.ChatMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessageEntity, Long> {
    List<ChatMessageEntity> findTop100ByPsychologist_IdAndUser_IdOrderByCreatedAtDesc(Long psychologistId, Long userId);
}


