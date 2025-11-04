package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;

	public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = new JwtService(System.getenv().getOrDefault("JWT_SECRET", "dev-secret-key-32-bytes-minimo-dev-seed"), 1000L * 60 * 60 * 24);
	}

	@Transactional
	public void register(String name, String email, String password) {
		if (userRepository.existsByEmail(email)) throw new IllegalArgumentException("Email ya registrado");
		UserEntity u = new UserEntity();
		u.setName(name);
		u.setEmail(email);
		u.setPasswordHash(passwordEncoder.encode(password));
		u.setRole("USER");
		userRepository.save(u);
	}

	public String login(String email, String password) {
		UserEntity u = userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("Credenciales invÃ¡lidas"));
		if (!passwordEncoder.matches(password, u.getPasswordHash())) throw new IllegalArgumentException("Credenciales invÃ¡lidas");
		return jwtService.generateToken(u.getEmail());
	}
}