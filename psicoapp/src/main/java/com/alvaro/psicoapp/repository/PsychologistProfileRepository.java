package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.PsychologistProfileEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PsychologistProfileRepository extends JpaRepository<PsychologistProfileEntity, Long> {
    Optional<PsychologistProfileEntity> findByUser(UserEntity user);
    Optional<PsychologistProfileEntity> findByUser_Id(Long userId);
}

