package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.InsurancePatientPolicyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InsurancePatientPolicyRepository extends JpaRepository<InsurancePatientPolicyEntity, Long> {
    List<InsurancePatientPolicyEntity> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<InsurancePatientPolicyEntity> findByInsuranceCompanyCompanyIdAndPatientIdOrderByCreatedAtDesc(Long companyId, Long patientId);
}
