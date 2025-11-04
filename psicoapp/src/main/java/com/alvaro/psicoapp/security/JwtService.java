package com.alvaro.psicoapp.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;

public class JwtService {
	private final Key key;
	private final long expirationMs;

	public JwtService(String secret, long expirationMs) {
		this.key = Keys.hmacShaKeyFor(secret.getBytes());
		this.expirationMs = expirationMs;
	}

	public String generateToken(String subject) {
		Date now = new Date();
		Date exp = new Date(now.getTime() + expirationMs);
		return Jwts.builder()
			.setSubject(subject)
			.setIssuedAt(now)
			.setExpiration(exp)
			.signWith(key, SignatureAlgorithm.HS256)
			.compact();
	}

	public String parseSubject(String token) {
		Jws<Claims> jws = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
		return jws.getBody().getSubject();
	}
}