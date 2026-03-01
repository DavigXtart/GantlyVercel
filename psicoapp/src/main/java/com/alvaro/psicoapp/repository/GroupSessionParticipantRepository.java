package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.GroupSessionParticipantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GroupSessionParticipantRepository extends JpaRepository<GroupSessionParticipantEntity, Long> {
    List<GroupSessionParticipantEntity> findByGroupSession_Id(Long groupSessionId);
    Optional<GroupSessionParticipantEntity> findByGroupSession_IdAndUser_Id(Long groupSessionId, Long userId);
    long countByGroupSession_Id(Long groupSessionId);
}
