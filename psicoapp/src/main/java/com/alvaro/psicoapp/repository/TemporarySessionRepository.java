package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.TemporarySessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TemporarySessionRepository extends JpaRepository<TemporarySessionEntity, Long> {
	Optional<TemporarySessionEntity> findBySessionId(String sessionId);
}

