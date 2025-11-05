package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.AppointmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<AppointmentEntity, Long> {
    List<AppointmentEntity> findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(Long psychologistId, Instant from, Instant to);
    List<AppointmentEntity> findByUser_IdOrderByStartTimeAsc(Long userId);
}


