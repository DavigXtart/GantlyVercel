package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.AppointmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<AppointmentEntity, Long> {
    List<AppointmentEntity> findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(Long psychologistId, Instant from, Instant to);
    List<AppointmentEntity> findByUser_IdOrderByStartTimeAsc(Long userId);
    
    
    // Obtener todas las citas reservadas por el usuario
    @Query("SELECT a FROM AppointmentEntity a WHERE a.user.id = :userId AND a.status = 'BOOKED' ORDER BY a.startTime ASC")
    List<AppointmentEntity> findBookedByUser_IdOrderByStartTimeAsc(@Param("userId") Long userId);
}


