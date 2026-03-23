package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.ClinicInvitationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ClinicInvitationRepository extends JpaRepository<ClinicInvitationEntity, Long> {
    List<ClinicInvitationEntity> findByCompanyIdOrderByCreatedAtDesc(Long companyId);
    Optional<ClinicInvitationEntity> findByToken(String token);
    Optional<ClinicInvitationEntity> findByCompanyIdAndEmailAndStatus(Long companyId, String email, String status);
}
