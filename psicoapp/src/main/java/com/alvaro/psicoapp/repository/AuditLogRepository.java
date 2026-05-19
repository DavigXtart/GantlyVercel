package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.AuditLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLogEntity, Long> {

    Page<AuditLogEntity> findByCreatedAtBetweenOrderByCreatedAtDesc(Instant from, Instant to, Pageable pageable);

    Page<AuditLogEntity> findByPerformedByIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            Long performedById, Instant from, Instant to, Pageable pageable);

    Page<AuditLogEntity> findByPerformedByIdInAndCreatedAtBetweenOrderByCreatedAtDesc(
            List<Long> performedByIds, Instant from, Instant to, Pageable pageable);

    List<AuditLogEntity> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, Long entityId);
}
