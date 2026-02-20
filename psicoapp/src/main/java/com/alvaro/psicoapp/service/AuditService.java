package com.alvaro.psicoapp.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Servicio de auditoría para cumplimiento RGPD.
 * Registra todos los accesos a datos sensibles de pacientes.
 * 
 * En producción, estos logs deberían almacenarse en una base de datos
 * separada con retención según políticas RGPD (típicamente 7 años).
 */
@Service
public class AuditService {
    private static final Logger auditLogger = LoggerFactory.getLogger("AUDIT");

    /**
     * Registra acceso a datos de paciente por parte de un psicólogo.
     */
    public void logPatientDataAccess(Long psychologistId, Long patientId, String dataType, String action) {
        auditLogger.info("RGPD_AUDIT|psychologistId={}|patientId={}|dataType={}|action={}|timestamp={}",
                psychologistId, patientId, dataType, action, Instant.now());
    }

    /**
     * Registra acceso denegado a datos de paciente.
     */
    public void logUnauthorizedAccess(Long requesterId, String requesterRole, Long targetPatientId, String dataType, String reason) {
        auditLogger.warn("RGPD_UNAUTHORIZED|requesterId={}|requesterRole={}|targetPatientId={}|dataType={}|reason={}|timestamp={}",
                requesterId, requesterRole, targetPatientId, dataType, reason, Instant.now());
    }

    /**
     * Registra acceso del propio paciente a sus datos.
     */
    public void logSelfDataAccess(Long userId, String dataType, String action) {
        auditLogger.info("RGPD_AUDIT|userId={}|dataType={}|action={}|selfAccess=true|timestamp={}",
                userId, dataType, action, Instant.now());
    }

    /**
     * Registra exportación de datos (requiere especial atención RGPD).
     */
    public void logDataExport(Long exporterId, String exporterRole, Long targetPatientId, String dataType, String format) {
        auditLogger.info("RGPD_EXPORT|exporterId={}|exporterRole={}|targetPatientId={}|dataType={}|format={}|timestamp={}",
                exporterId, exporterRole, targetPatientId, dataType, format, Instant.now());
    }

    /**
     * Registra eliminación de datos (derecho al olvido RGPD).
     */
    public void logDataDeletion(Long deleterId, String deleterRole, Long targetPatientId, String dataType) {
        auditLogger.info("RGPD_DELETION|deleterId={}|deleterRole={}|targetPatientId={}|dataType={}|timestamp={}",
                deleterId, deleterRole, targetPatientId, dataType, Instant.now());
    }
}
