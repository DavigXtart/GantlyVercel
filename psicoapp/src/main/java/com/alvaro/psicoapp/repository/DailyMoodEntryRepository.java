package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.DailyMoodEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyMoodEntryRepository extends JpaRepository<DailyMoodEntryEntity, Long> {
    Optional<DailyMoodEntryEntity> findByUser_IdAndEntryDate(Long userId, LocalDate entryDate);
    List<DailyMoodEntryEntity> findByUser_IdOrderByEntryDateDesc(Long userId);
    List<DailyMoodEntryEntity> findByUser_IdAndEntryDateBetween(Long userId, LocalDate start, LocalDate end);
}

