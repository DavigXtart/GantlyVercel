package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.ClinicRoomEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClinicRoomRepository extends JpaRepository<ClinicRoomEntity, Long> {
    List<ClinicRoomEntity> findByCompanyIdOrderByNameAsc(Long companyId);

    @Modifying
    @Query("UPDATE ClinicRoomEntity r SET r.assignedPsychologistId = null WHERE r.assignedPsychologistId = :psychologistId")
    int clearAssignedPsychologist(@Param("psychologistId") Long psychologistId);
}
