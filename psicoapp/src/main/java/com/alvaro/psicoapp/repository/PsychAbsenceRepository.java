package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.PsychAbsenceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface PsychAbsenceRepository extends JpaRepository<PsychAbsenceEntity, Long> {
    List<PsychAbsenceEntity> findByPsychologist_IdAndEndTimeAfterOrderByStartTimeAsc(Long psychId, Instant now);

    @Query("SELECT a FROM PsychAbsenceEntity a WHERE a.psychologist.id = :psychId AND a.startTime < :end AND a.endTime > :start")
    List<PsychAbsenceEntity> findOverlapping(@Param("psychId") Long psychId, @Param("start") Instant start, @Param("end") Instant end);

    void deleteByPsychologist_Id(Long psychologistId);
}
