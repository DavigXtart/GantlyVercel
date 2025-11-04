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

	/**
	 * Crea una nueva sesión temporal
	 */
	public TemporarySessionEntity createSession() {
		TemporarySessionEntity session = new TemporarySessionEntity();
		session.setSessionId(UUID.randomUUID().toString());
		session.setInitialTestCompleted(false);
		session.setExpiresAt(Instant.now().plusSeconds(24 * 60 * 60)); // 24 horas
		return sessionRepository.save(session);
	}

	/**
	 * Obtiene una sesión por su ID
	 */
	public Optional<TemporarySessionEntity> getSession(String sessionId) {
		Optional<TemporarySessionEntity> session = sessionRepository.findBySessionId(sessionId);
		if (session.isPresent()) {
			TemporarySessionEntity s = session.get();
			// Verificar si la sesión ha expirado
			if (s.getExpiresAt().isBefore(Instant.now())) {
				sessionRepository.delete(s);
				return Optional.empty();
			}
		}
		return session;
	}

	/**
	 * Marca el test inicial como completado
	 */
	@Transactional
	public void markInitialTestCompleted(String sessionId) {
		TemporarySessionEntity session = sessionRepository.findBySessionId(sessionId)
				.orElseThrow(() -> new IllegalArgumentException("Sesión no encontrada"));
		session.setInitialTestCompleted(true);
		sessionRepository.save(session);
	}

	/**
	 * Elimina una sesión temporal
	 */
	public void deleteSession(String sessionId) {
		sessionRepository.findBySessionId(sessionId).ifPresent(sessionRepository::delete);
	}

	/**
	 * Limpia sesiones expiradas
	 */
	@Transactional
	public void cleanupExpiredSessions() {
		sessionRepository.findAll().stream()
				.filter(s -> s.getExpiresAt().isBefore(Instant.now()))
				.forEach(sessionRepository::delete);
	}
}

