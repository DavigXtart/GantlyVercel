package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.AppointmentRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRequestRepository extends JpaRepository<AppointmentRequestEntity, Long> {
    List<AppointmentRequestEntity> findByAppointment_Id(Long appointmentId);
    List<AppointmentRequestEntity> findByAppointment_IdAndStatus(Long appointmentId, String status);
    List<AppointmentRequestEntity> findByUser_IdOrderByRequestedAtDesc(Long userId);
    
    @Query("SELECT ar FROM AppointmentRequestEntity ar WHERE ar.appointment.id = :appointmentId AND ar.user.id = :userId")
    Optional<AppointmentRequestEntity> findByAppointment_IdAndUser_Id(@Param("appointmentId") Long appointmentId, @Param("userId") Long userId);
    
    @Query("SELECT ar FROM AppointmentRequestEntity ar WHERE ar.appointment.psychologist.id = :psychologistId AND ar.status = 'PENDING' ORDER BY ar.requestedAt ASC")
    List<AppointmentRequestEntity> findPendingByPsychologist_Id(@Param("psychologistId") Long psychologistId);
}

