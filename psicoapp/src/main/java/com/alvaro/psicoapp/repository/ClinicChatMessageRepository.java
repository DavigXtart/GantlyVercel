package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.ClinicChatMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface ClinicChatMessageRepository extends JpaRepository<ClinicChatMessageEntity, Long> {
    List<ClinicChatMessageEntity> findByCompanyIdAndPatientIdOrderByCreatedAtAsc(Long companyId, Long patientId);
    List<ClinicChatMessageEntity> findByCompanyIdAndPatientIdAndCreatedAtAfterOrderByCreatedAtAsc(
            Long companyId, Long patientId, Instant after);
}
