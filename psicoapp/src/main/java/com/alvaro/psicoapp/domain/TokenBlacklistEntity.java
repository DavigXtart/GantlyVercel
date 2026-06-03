package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "token_blacklist", indexes = {
    @Index(name = "idx_tb_token_hash", columnList = "token_hash", unique = true),
    @Index(name = "idx_tb_expires_at", columnList = "expires_at")
})
public class TokenBlacklistEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "blacklisted_at", nullable = false)
    private Instant blacklistedAt;

    @PrePersist
    void prePersist() { if (blacklistedAt == null) blacklistedAt = Instant.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public Instant getBlacklistedAt() { return blacklistedAt; }
    public void setBlacklistedAt(Instant blacklistedAt) { this.blacklistedAt = blacklistedAt; }
}
