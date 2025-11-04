package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "temporary_sessions")
public class TemporarySessionEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 100)
	private String sessionId; // UUID para identificar la sesión temporal

	@Column(nullable = false)
	private Boolean initialTestCompleted = false; // Si completó el test inicial

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	@Column(name = "expires_at", nullable = false)
	private Instant expiresAt; // Expira después de 24 horas

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public String getSessionId() { return sessionId; }
	public void setSessionId(String sessionId) { this.sessionId = sessionId; }
	public Boolean getInitialTestCompleted() { return initialTestCompleted; }
	public void setInitialTestCompleted(Boolean initialTestCompleted) { this.initialTestCompleted = initialTestCompleted; }
	public Instant getCreatedAt() { return createdAt; }
	public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
	public Instant getExpiresAt() { return expiresAt; }
	public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}

