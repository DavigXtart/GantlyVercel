package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.AuditLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLogEntity, Long> {

    Page<AuditLogEntity> findByCreatedAtBetweenOrderByCreatedAtDesc(Instant from, Instant to, Pageable pageable);

    Page<AuditLogEntity> findByPerformedByIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            Long performedById, Instant from, Instant to, Pageable pageable);

    Page<AuditLogEntity> findByPerformedByIdInAndCreatedAtBetweenOrderByCreatedAtDesc(
            List<Long> performedByIds, Instant from, Instant to, Pageable pageable);

    List<AuditLogEntity> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, Long entityId);

    /** RGPD-13: Delete audit logs older than the given cutoff date */
    @Modifying
    @Query("DELETE FROM AuditLogEntity a WHERE a.createdAt < :cutoff")
    int deleteByCreatedAtBefore(Instant cutoff);
}
