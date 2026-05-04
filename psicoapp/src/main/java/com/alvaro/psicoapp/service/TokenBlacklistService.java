package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory token blacklist for invalidating JWT tokens on logout.
 * Stores SHA-256 hashes of tokens with their expiry times.
 * Periodically cleans up expired entries.
 */
@Service
public class TokenBlacklistService {
    private static final Logger logger = LoggerFactory.getLogger(TokenBlacklistService.class);

    private final ConcurrentHashMap<String, Instant> blacklistedTokens = new ConcurrentHashMap<>();
    private final JwtService jwtService;

    public TokenBlacklistService(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    /**
     * Blacklists a token by storing its hash with the token's expiry time.
     */
    public void blacklist(String token) {
        if (token == null || token.isEmpty()) return;

        String hash = hashToken(token);
        Date expiry = jwtService.getExpiration(token);
        Instant expiryInstant = (expiry != null) ? expiry.toInstant() : Instant.now().plusSeconds(86400);
        blacklistedTokens.put(hash, expiryInstant);
        logger.debug("Token blacklisted, hash: {}..., expires: {}", hash.substring(0, 8), expiryInstant);
    }

    /**
     * Checks if a token has been blacklisted.
     */
    public boolean isBlacklisted(String token) {
        if (token == null || token.isEmpty()) return false;

        String hash = hashToken(token);
        Instant expiry = blacklistedTokens.get(hash);
        if (expiry == null) return false;

        // If the token's original expiry has passed, remove it from the blacklist
        if (expiry.isBefore(Instant.now())) {
            blacklistedTokens.remove(hash);
            return false;
        }
        return true;
    }

    /**
     * Scheduled cleanup of expired blacklist entries every 15 minutes.
     */
    @Scheduled(fixedRate = 900000)
    public void cleanupExpiredEntries() {
        Instant now = Instant.now();
        int before = blacklistedTokens.size();
        blacklistedTokens.entrySet().removeIf(entry -> entry.getValue().isBefore(now));
        int removed = before - blacklistedTokens.size();
        if (removed > 0) {
            logger.debug("Token blacklist cleanup: removed {} expired entries, {} remaining", removed, blacklistedTokens.size());
        }
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
