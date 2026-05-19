package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.InsuranceCompanyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InsuranceCompanyRepository extends JpaRepository<InsuranceCompanyEntity, Long> {
    List<InsuranceCompanyEntity> findByCompanyIdAndActiveTrueOrderByNameAsc(Long companyId);
    List<InsuranceCompanyEntity> findByCompanyIdOrderByNameAsc(Long companyId);
}
