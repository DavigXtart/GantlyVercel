package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.WaitingListEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WaitingListRepository extends JpaRepository<WaitingListEntity, Long> {
    List<WaitingListEntity> findByCompanyIdAndStatusOrderByCreatedAtAsc(Long companyId, String status);
    List<WaitingListEntity> findByCompanyIdOrderByCreatedAtDesc(Long companyId);
    Optional<WaitingListEntity> findByIdAndCompanyId(Long id, Long companyId);

    void deleteByPatient_Id(Long patientId);

    @Modifying
    @Query("UPDATE WaitingListEntity w SET w.psychologistPreference = null WHERE w.psychologistPreference.id = :psychologistId")
    int nullifyPsychologistPreference(@Param("psychologistId") Long psychologistId);

    @Modifying
    @Query("UPDATE WaitingListEntity w SET w.scheduledAppointment = null WHERE w.scheduledAppointment.psychologist.id = :psychologistId")
    int nullifyScheduledAppointmentByPsychologist(@Param("psychologistId") Long psychologistId);

    @Modifying
    @Query("UPDATE WaitingListEntity w SET w.scheduledAppointment = null WHERE w.scheduledAppointment.user.id = :userId")
    int nullifyScheduledAppointmentByUser(@Param("userId") Long userId);
}
