package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.UserPsychologistEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserPsychologistRepository extends JpaRepository<UserPsychologistEntity, Long> {
    Optional<UserPsychologistEntity> findByUserId(Long userId);
    List<UserPsychologistEntity> findByPsychologist_Id(Long psychologistId);
    
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM user_psychologist WHERE user_id = :userId", nativeQuery = true)
    int deleteByUserId(@Param("userId") Long userId);
    
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "INSERT INTO user_psychologist (user_id, psychologist_id, assigned_at) VALUES (:userId, :psychologistId, CURRENT_TIMESTAMP)", nativeQuery = true)
    int insertRelation(@Param("userId") Long userId, @Param("psychologistId") Long psychologistId);
}


