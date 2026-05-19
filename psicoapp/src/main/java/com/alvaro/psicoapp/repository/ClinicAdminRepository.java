package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.ClinicAdminEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ClinicAdminRepository extends JpaRepository<ClinicAdminEntity, Long> {
    List<ClinicAdminEntity> findByCompanyIdAndStatusOrderByInvitedAtDesc(Long companyId, String status);
    List<ClinicAdminEntity> findByCompanyIdOrderByInvitedAtDesc(Long companyId);
    Optional<ClinicAdminEntity> findByCompanyIdAndUserId(Long companyId, Long userId);
    Optional<ClinicAdminEntity> findByUserIdAndStatus(Long userId, String status);
}
