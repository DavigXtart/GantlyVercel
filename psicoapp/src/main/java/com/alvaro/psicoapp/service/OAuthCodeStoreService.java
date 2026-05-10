package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.security.JwtService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Stores short-lived one-time authorization codes for OAuth2 callback.
 * Instead of sending the real JWT in the redirect URL (visible in browser history),
 * we generate a random code that the frontend exchanges for the real token pair
 * via a POST request. Codes expire after 30 seconds and are single-use.
 */
@Service
public class OAuthCodeStoreService {

	private static final long CODE_TTL_MS = 30_000; // 30 seconds

	private final ConcurrentHashMap<String, CodeEntry> codes = new ConcurrentHashMap<>();

	/**
	 * Stores a token pair and returns a one-time code.
	 */
	public String storeTokenPair(JwtService.TokenPair tokenPair) {
		String code = UUID.randomUUID().toString();
		codes.put(code, new CodeEntry(tokenPair, Instant.now()));
		return code;
	}

	/**
	 * Exchanges a one-time code for the stored token pair.
	 * Returns null if code is invalid, expired, or already used.
	 */
	public JwtService.TokenPair exchangeCode(String code) {
		if (code == null || code.isEmpty()) return null;
		CodeEntry entry = codes.remove(code); // single-use: remove immediately
		if (entry == null) return null;
		if (Instant.now().isAfter(entry.createdAt.plusMillis(CODE_TTL_MS))) {
			return null; // expired
		}
		return entry.tokenPair;
	}

	/**
	 * Cleanup expired codes every 60 seconds to prevent memory leaks.
	 */
	@Scheduled(fixedRate = 60_000)
	public void cleanupExpiredCodes() {
		Instant cutoff = Instant.now().minusMillis(CODE_TTL_MS);
		codes.entrySet().removeIf(e -> e.getValue().createdAt.isBefore(cutoff));
	}

	private static class CodeEntry {
		final JwtService.TokenPair tokenPair;
		final Instant createdAt;

		CodeEntry(JwtService.TokenPair tokenPair, Instant createdAt) {
			this.tokenPair = tokenPair;
			this.createdAt = createdAt;
		}
	}
}
