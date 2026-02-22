package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.TemporarySessionEntity;
import com.alvaro.psicoapp.repository.TemporarySessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class TemporarySessionService {
	private final TemporarySessionRepository sessionRepository;

	public TemporarySessionService(TemporarySessionRepository sessionRepository) {
		this.sessionRepository = sessionRepository;
	}

	public TemporarySessionEntity createSession() {
		TemporarySessionEntity session = new TemporarySessionEntity();
		session.setSessionId(UUID.randomUUID().toString());
		session.setInitialTestCompleted(false);
		session.setExpiresAt(Instant.now().plusSeconds(24 * 60 * 60));
		return sessionRepository.save(session);
	}

	public Optional<TemporarySessionEntity> getSession(String sessionId) {
		Optional<TemporarySessionEntity> session = sessionRepository.findBySessionId(sessionId);
		if (session.isPresent()) {
			TemporarySessionEntity s = session.get();

			if (s.getExpiresAt().isBefore(Instant.now())) {
				sessionRepository.delete(s);
				return Optional.empty();
			}
		}
		return session;
	}

	@Transactional
	public void markInitialTestCompleted(String sessionId) {
		TemporarySessionEntity session = sessionRepository.findBySessionId(sessionId)
				.orElseThrow(() -> new IllegalArgumentException("Sesión no encontrada"));
		session.setInitialTestCompleted(true);
		sessionRepository.save(session);
	}

	public void deleteSession(String sessionId) {
		sessionRepository.findBySessionId(sessionId).ifPresent(sessionRepository::delete);
	}

	@Transactional
	public void cleanupExpiredSessions() {
		sessionRepository.findAll().stream()
				.filter(s -> s.getExpiresAt().isBefore(Instant.now()))
				.forEach(sessionRepository::delete);
	}
}
