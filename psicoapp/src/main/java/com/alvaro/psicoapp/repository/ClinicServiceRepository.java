package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.ClinicServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClinicServiceRepository extends JpaRepository<ClinicServiceEntity, Long> {
    List<ClinicServiceEntity> findByCompanyIdOrderByNameAsc(Long companyId);
}
