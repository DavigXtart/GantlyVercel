package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.ClinicPatientProfileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface ClinicPatientProfileRepository extends JpaRepository<ClinicPatientProfileEntity, Long> {
    Optional<ClinicPatientProfileEntity> findByCompanyIdAndPatientId(Long companyId, Long patientId);
    List<ClinicPatientProfileEntity> findByCompanyId(Long companyId);
    int countByCompanyId(Long companyId);
}
