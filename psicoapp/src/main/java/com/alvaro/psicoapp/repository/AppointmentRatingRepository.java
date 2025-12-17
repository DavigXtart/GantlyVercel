package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.AppointmentRatingEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppointmentRatingRepository extends JpaRepository<AppointmentRatingEntity, Long> {
    Optional<AppointmentRatingEntity> findByAppointment_IdAndUser_Id(Long appointmentId, Long userId);
    
    @Query("SELECT AVG(r.rating) FROM AppointmentRatingEntity r WHERE r.psychologist.id = :psychologistId")
    Double findAverageRatingByPsychologistId(@Param("psychologistId") Long psychologistId);
    
    @Query("SELECT COUNT(r) FROM AppointmentRatingEntity r WHERE r.psychologist.id = :psychologistId")
    Long countByPsychologistId(@Param("psychologistId") Long psychologistId);
}

