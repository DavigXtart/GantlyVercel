package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.WeeklyScheduleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WeeklyScheduleRepository extends JpaRepository<WeeklyScheduleEntity, Long> {
    List<WeeklyScheduleEntity> findByPsychologist_IdOrderByDayOfWeekAsc(Long psychologistId);

    List<WeeklyScheduleEntity> findByEnabledTrue();

    List<WeeklyScheduleEntity> findByPsychologist_IdAndEnabledTrue(Long psychologistId);

    void deleteByPsychologist_Id(Long psychologistId);

    @Query("SELECT DISTINCT ws.psychologist.id FROM WeeklyScheduleEntity ws WHERE ws.enabled = true")
    List<Long> findDistinctPsychologistIdsWithEnabledSchedule();
}
