package com.alvaro.psicoapp.security;

import java.security.Key;
import java.util.Date;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;

public class JwtService {
	private static final Logger logger = LoggerFactory.getLogger(JwtService.class);
	private final Key key;
	private final long accessTokenExpirationMs;
	private final long refreshTokenExpirationMs;

	public JwtService(String secret, long accessTokenExpirationMs, long refreshTokenExpirationMs) {

		if (secret == null || secret.getBytes().length < 32) {
			throw new IllegalArgumentException("JWT_SECRET debe tener al menos 32 bytes (256 bits) para seguridad AES-256");
		}
		this.key = Keys.hmacShaKeyFor(secret.getBytes());
		this.accessTokenExpirationMs = accessTokenExpirationMs;
		this.refreshTokenExpirationMs = refreshTokenExpirationMs;
	}

	public String generateAccessToken(String subject) {
		Date now = new Date();
		Date exp = new Date(now.getTime() + accessTokenExpirationMs);
		return Jwts.builder()
			.setSubject(subject)
			.setIssuedAt(now)
			.setExpiration(exp)
			.claim("type", "access")
			.signWith(key, SignatureAlgorithm.HS256)
			.compact();
	}

	public String generateRefreshToken(String subject) {
		Date now = new Date();
		Date exp = new Date(now.getTime() + refreshTokenExpirationMs);
		return Jwts.builder()
			.setSubject(subject)
			.setIssuedAt(now)
			.setExpiration(exp)
			.claim("type", "refresh")
			.signWith(key, SignatureAlgorithm.HS256)
			.compact();
	}

	public TokenPair generateTokenPair(String subject) {
		return new TokenPair(generateAccessToken(subject), generateRefreshToken(subject));
	}

	public String parseSubject(String token) {
		try {
			Jws<Claims> jws = Jwts.parserBuilder()
				.setSigningKey(key)
				.build()
				.parseClaimsJws(token);

			Claims claims = jws.getBody();

			String tokenType = claims.get("type", String.class);
			if (tokenType != null && !"access".equals(tokenType)) {
				logger.debug("Token rechazado: tipo incorrecto (esperado 'access', encontrado '{}')", tokenType);
				throw new SecurityException("Token inválido: tipo incorrecto");
			}

			if (tokenType != null) {
				Date issuedAt = claims.getIssuedAt();
				if (issuedAt != null) {
					long age = System.currentTimeMillis() - issuedAt.getTime();

					if (age > 24 * 60 * 60 * 1000) {
						throw new SecurityException("Token demasiado antiguo");
					}
				}
			}

			return claims.getSubject();
		} catch (ExpiredJwtException e) {
			logger.debug("Token expirado: {}", e.getMessage());
			throw new SecurityException("Token expirado");
		} catch (MalformedJwtException | UnsupportedJwtException e) {
			logger.warn("Token inválido: {}", e.getMessage());
			throw new SecurityException("Token inválido");
		} catch (SecurityException e) {
			throw e;
		} catch (Exception e) {
			logger.error("Error validando token", e);
			throw new SecurityException("Error validando token");
		}
	}

	public String parseRefreshToken(String refreshToken) {
		try {
			Jws<Claims> jws = Jwts.parserBuilder()
				.setSigningKey(key)
				.require("type", "refresh")
				.build()
				.parseClaimsJws(refreshToken);

			return jws.getBody().getSubject();
		} catch (ExpiredJwtException e) {
			logger.debug("Refresh token expirado");
			throw new SecurityException("Refresh token expirado");
		} catch (Exception e) {
			logger.warn("Refresh token inválido: {}", e.getMessage());
			throw new SecurityException("Refresh token inválido");
		}
	}

	public static class TokenPair {
		public final String accessToken;
		public final String refreshToken;

		public TokenPair(String accessToken, String refreshToken) {
			this.accessToken = accessToken;
			this.refreshToken = refreshToken;
		}
	}
}
