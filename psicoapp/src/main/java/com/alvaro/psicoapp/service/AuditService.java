package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.AuditLogEntity;
import com.alvaro.psicoapp.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class AuditService {
    private static final Logger auditLogger = LoggerFactory.getLogger("AUDIT");

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    // --- Persistent audit log methods ---

    public void persistAudit(String action, String entityType, Long entityId,
                             Long performedById, String performedByRole,
                             String performedByName, Long targetUserId, String details) {
        try {
            AuditLogEntity log = new AuditLogEntity();
            log.setAction(action);
            log.setEntityType(entityType);
            log.setEntityId(entityId);
            log.setPerformedById(performedById);
            log.setPerformedByRole(performedByRole);
            log.setPerformedByName(performedByName);
            log.setTargetUserId(targetUserId);
            log.setDetails(details);
            auditLogRepository.save(log);
        } catch (Exception e) {
            auditLogger.error("Failed to persist audit log: action={}, entityType={}, entityId={}",
                    action, entityType, entityId, e);
        }
    }

    public Page<AuditLogEntity> getAuditLogs(Instant from, Instant to, Pageable pageable) {
        return auditLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(from, to, pageable);
    }

    public Page<AuditLogEntity> getAuditLogsByPerformer(Long performedById, Instant from, Instant to, Pageable pageable) {
        return auditLogRepository.findByPerformedByIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                performedById, from, to, pageable);
    }

    public Page<AuditLogEntity> getAuditLogsByPerformers(List<Long> performerIds, Instant from, Instant to, Pageable pageable) {
        return auditLogRepository.findByPerformedByIdInAndCreatedAtBetweenOrderByCreatedAtDesc(
                performerIds, from, to, pageable);
    }

    // --- Legacy log-only methods (kept for backwards compatibility) ---

    public void logPatientDataAccess(Long psychologistId, Long patientId, String dataType, String action) {
        auditLogger.info("RGPD_AUDIT|psychologistId={}|patientId={}|dataType={}|action={}|timestamp={}",
                psychologistId, patientId, dataType, action, Instant.now());
    }

    public void logUnauthorizedAccess(Long requesterId, String requesterRole, Long targetPatientId, String dataType, String reason) {
        auditLogger.warn("RGPD_UNAUTHORIZED|requesterId={}|requesterRole={}|targetPatientId={}|dataType={}|reason={}|timestamp={}",
                requesterId, requesterRole, targetPatientId, dataType, reason, Instant.now());
    }

    public void logSelfDataAccess(Long userId, String dataType, String action) {
        auditLogger.info("RGPD_AUDIT|userId={}|dataType={}|action={}|selfAccess=true|timestamp={}",
                userId, dataType, action, Instant.now());
    }

    public void logDataExport(Long exporterId, String exporterRole, Long targetPatientId, String dataType, String format) {
        auditLogger.info("RGPD_EXPORT|exporterId={}|exporterRole={}|targetPatientId={}|dataType={}|format={}|timestamp={}",
                exporterId, exporterRole, targetPatientId, dataType, format, Instant.now());
    }

    public void logDataDeletion(Long deleterId, String deleterRole, Long targetPatientId, String dataType) {
        auditLogger.info("RGPD_DELETION|deleterId={}|deleterRole={}|targetPatientId={}|dataType={}|timestamp={}",
                deleterId, deleterRole, targetPatientId, dataType, Instant.now());
    }

    public void logCalendarAction(String action, Long appointmentId, Long psychologistId, Long userId) {
        auditLogger.info("CALENDAR_AUDIT|action={}|appointmentId={}|psychologistId={}|userId={}|timestamp={}",
                action, appointmentId, psychologistId, userId, Instant.now());
    }
}
