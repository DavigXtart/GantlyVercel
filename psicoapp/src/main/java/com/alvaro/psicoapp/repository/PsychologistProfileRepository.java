package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.PsychologistProfileEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PsychologistProfileRepository extends JpaRepository<PsychologistProfileEntity, Long> {
    Optional<PsychologistProfileEntity> findByUser(UserEntity user);
    Optional<PsychologistProfileEntity> findByUser_Id(Long userId);
    List<PsychologistProfileEntity> findByApprovedFalseOrderByUpdatedAtDesc();
    List<PsychologistProfileEntity> findByApprovedTrueOrderByUpdatedAtDesc();

    /** Finds profiles pending review: rejected (false) or resubmitted (null) */
    @Query("SELECT p FROM PsychologistProfileEntity p WHERE p.approved = false OR p.approved IS NULL ORDER BY p.updatedAt DESC")
    List<PsychologistProfileEntity> findPendingReviewOrderByUpdatedAtDesc();

    void deleteByUser_Id(Long userId);
}
