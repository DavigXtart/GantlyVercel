package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.GroupSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.Instant;
import java.util.List;

public interface GroupSessionRepository extends JpaRepository<GroupSessionEntity, Long> {
    List<GroupSessionEntity> findByStartTimeAfterAndStatusOrderByStartTimeAsc(Instant now, String status);
    List<GroupSessionEntity> findByPsychologist_IdOrderByStartTimeDesc(Long psychologistId);
    @Query("SELECT gs FROM GroupSessionEntity gs JOIN GroupSessionParticipantEntity gsp ON gs.id = gsp.groupSession.id WHERE gsp.user.id = :userId ORDER BY gs.startTime DESC")
    List<GroupSessionEntity> findByParticipantUserId(Long userId);
}
