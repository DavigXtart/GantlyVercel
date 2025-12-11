package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.domain.TestEntity;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.repository.TestRepository;
import com.alvaro.psicoapp.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final TemporarySessionService sessionService;
	private final TestResultService testResultService;
	private final TestRepository testRepository;
	private final EmailService emailService;
	private static final String INITIAL_TEST_CODE = "INITIAL";

	public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
			TemporarySessionService sessionService, TestResultService testResultService,
			TestRepository testRepository, EmailService emailService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = new JwtService(System.getenv().getOrDefault("JWT_SECRET", "dev-secret-key-32-bytes-minimo-dev-seed"), 1000L * 60 * 60 * 24);
		this.sessionService = sessionService;
		this.testResultService = testResultService;
		this.testRepository = testRepository;
		this.emailService = emailService;
	}

	@Transactional
	public String register(String name, String email, String password, String sessionId, String role) {
		if (userRepository.existsByEmail(email)) throw new IllegalArgumentException("Email ya registrado");
		
		// Verificar que el test inicial fue completado si se proporciona sessionId (solo para usuarios)
		if (sessionId != null && !sessionId.isEmpty() && (role == null || "USER".equals(role))) {
			var sessionOpt = sessionService.getSession(sessionId);
			if (!sessionOpt.isPresent() || !sessionOpt.get().getInitialTestCompleted()) {
				throw new IllegalArgumentException("Debe completar el test inicial antes de registrarse");
			}
		}
		
		UserEntity u = new UserEntity();
		u.setName(name);
		u.setEmail(email);
		u.setPasswordHash(passwordEncoder.encode(password));
		u.setRole(role != null && !role.isEmpty() ? role : "USER");
		u.setEmailVerified(false);
		
		// Generar token de verificación
		String verificationToken = UUID.randomUUID().toString();
		u.setVerificationToken(verificationToken);
		u.setVerificationTokenExpiresAt(Instant.now().plusSeconds(24 * 60 * 60)); // 24 horas
		
		userRepository.save(u);

		// Si hay sesión temporal, transferir respuestas al usuario
		if (sessionId != null && !sessionId.isEmpty()) {
			var sessionOpt = sessionService.getSession(sessionId);
			if (sessionOpt.isPresent()) {
				testResultService.transferSessionAnswersToUser(sessionOpt.get(), u);
				
				// Calcular resultados del test inicial
				var testOpt = testRepository.findByCode(INITIAL_TEST_CODE);
				if (testOpt.isPresent()) {
					testResultService.calculateAndSaveResults(u, null, testOpt.get());
				}
				
				// Eliminar sesión temporal
				sessionService.deleteSession(sessionId);
			}
		}
		
		// Enviar correo de verificación (para todos los usuarios, incluyendo psicólogos)
		try {
			boolean isPsychologist = "PSYCHOLOGIST".equals(u.getRole());
			emailService.sendVerificationEmail(u.getEmail(), u.getName(), verificationToken, isPsychologist);
		} catch (Exception e) {
			System.err.println("Error enviando correo de verificación: " + e.getMessage());
			// No fallar el registro si falla el envío del correo
		}
		
		return jwtService.generateToken(u.getEmail());
	}
	
	@Transactional
	public boolean verifyEmail(String token) {
		var userOpt = userRepository.findByVerificationToken(token);
		if (userOpt.isEmpty()) {
			return false;
		}
		
		UserEntity user = userOpt.get();
		
		// Verificar que el token no haya expirado
		if (user.getVerificationTokenExpiresAt() != null && 
		    user.getVerificationTokenExpiresAt().isBefore(Instant.now())) {
			return false;
		}
		
		// Verificar el email
		user.setEmailVerified(true);
		user.setVerificationToken(null);
		user.setVerificationTokenExpiresAt(null);
		userRepository.save(user);
		
		return true;
	}

	public String login(String email, String password) {
		UserEntity u = userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("Credenciales inválidas"));
		if (!passwordEncoder.matches(password, u.getPasswordHash())) throw new IllegalArgumentException("Credenciales inválidas");
		return jwtService.generateToken(u.getEmail());
	}
}