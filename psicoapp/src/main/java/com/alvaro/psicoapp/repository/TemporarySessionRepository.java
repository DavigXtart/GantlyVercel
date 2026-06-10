package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.TemporarySessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.Optional;

public interface TemporarySessionRepository extends JpaRepository<TemporarySessionEntity, Long> {
	Optional<TemporarySessionEntity> findBySessionId(String sessionId);

	@Modifying
	@Query("DELETE FROM TemporarySessionEntity t WHERE t.expiresAt < :now")
	int deleteExpiredBefore(@Param("now") Instant now);
}
