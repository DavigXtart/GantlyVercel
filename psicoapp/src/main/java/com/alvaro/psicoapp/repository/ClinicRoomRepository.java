package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.ClinicRoomEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClinicRoomRepository extends JpaRepository<ClinicRoomEntity, Long> {
    List<ClinicRoomEntity> findByCompanyIdOrderByNameAsc(Long companyId);
}
