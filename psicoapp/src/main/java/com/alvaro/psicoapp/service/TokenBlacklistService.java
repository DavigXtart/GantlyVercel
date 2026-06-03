package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.TokenBlacklistEntity;
import com.alvaro.psicoapp.repository.TokenBlacklistRepository;
import com.alvaro.psicoapp.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Date;
import java.util.HexFormat;

/**
 * Database-backed token blacklist for invalidating JWT tokens on logout.
 * Stores SHA-256 hashes of tokens with their expiry times.
 * Survives server restarts (unlike the previous in-memory ConcurrentHashMap).
 * Periodically cleans up expired entries.
 */
@Service
public class TokenBlacklistService {
    private static final Logger logger = LoggerFactory.getLogger(TokenBlacklistService.class);

    private final TokenBlacklistRepository tokenBlacklistRepository;
    private final JwtService jwtService;

    public TokenBlacklistService(TokenBlacklistRepository tokenBlacklistRepository, JwtService jwtService) {
        this.tokenBlacklistRepository = tokenBlacklistRepository;
        this.jwtService = jwtService;
    }

    /**
     * Blacklists a token by storing its SHA-256 hash with the token's expiry time.
     */
    @Transactional
    public void blacklist(String token) {
        if (token == null || token.isEmpty()) return;

        String hash = hashToken(token);

        // Avoid duplicate entries
        if (tokenBlacklistRepository.existsByTokenHash(hash)) {
            logger.debug("Token already blacklisted, hash: {}...", hash.substring(0, 8));
            return;
        }

        Date expiry = jwtService.getExpiration(token);
        Instant expiryInstant = (expiry != null) ? expiry.toInstant() : Instant.now().plusSeconds(86400);

        TokenBlacklistEntity entity = new TokenBlacklistEntity();
        entity.setTokenHash(hash);
        entity.setExpiresAt(expiryInstant);
        entity.setBlacklistedAt(Instant.now());

        tokenBlacklistRepository.save(entity);
        logger.debug("Token blacklisted, hash: {}..., expires: {}", hash.substring(0, 8), expiryInstant);
    }

    /**
     * Checks if a token has been blacklisted.
     */
    @Transactional(readOnly = true)
    public boolean isBlacklisted(String token) {
        if (token == null || token.isEmpty()) return false;

        String hash = hashToken(token);
        return tokenBlacklistRepository.existsByTokenHash(hash);
    }

    /**
     * Scheduled cleanup of expired blacklist entries every 15 minutes.
     */
    @Scheduled(fixedRate = 900000)
    @Transactional
    public void cleanupExpiredEntries() {
        int removed = tokenBlacklistRepository.deleteExpiredTokens(Instant.now());
        if (removed > 0) {
            logger.debug("Token blacklist cleanup: removed {} expired entries", removed);
        }
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
