package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.ConsentRequestEntity;
import com.alvaro.psicoapp.domain.ConsentRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ConsentRequestRepository extends JpaRepository<ConsentRequestEntity, Long> {
    List<ConsentRequestEntity> findByUser_IdAndStatusInOrderByCreatedAtDesc(Long userId, Collection<ConsentRequestStatus> statuses);
    List<ConsentRequestEntity> findByPsychologist_IdAndUser_IdInOrderByCreatedAtDesc(Long psychologistId, Collection<Long> userIds);
    Optional<ConsentRequestEntity> findTop1ByPsychologist_IdAndUser_IdOrderByCreatedAtDesc(Long psychologistId, Long userId);
    boolean existsByPsychologist_IdAndUser_IdAndStatus(Long psychologistId, Long userId, ConsentRequestStatus status);
}
