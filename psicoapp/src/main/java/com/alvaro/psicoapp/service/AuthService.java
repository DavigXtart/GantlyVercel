package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.domain.TestEntity;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.repository.TestRepository;
import com.alvaro.psicoapp.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final TemporarySessionService sessionService;
	private final TestResultService testResultService;
	private final TestRepository testRepository;
	private static final String INITIAL_TEST_CODE = "INITIAL";

	public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
			TemporarySessionService sessionService, TestResultService testResultService,
			TestRepository testRepository) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = new JwtService(System.getenv().getOrDefault("JWT_SECRET", "dev-secret-key-32-bytes-minimo-dev-seed"), 1000L * 60 * 60 * 24);
		this.sessionService = sessionService;
		this.testResultService = testResultService;
		this.testRepository = testRepository;
	}

	@Transactional
	public String register(String name, String email, String password, String sessionId) {
		if (userRepository.existsByEmail(email)) throw new IllegalArgumentException("Email ya registrado");
		
		// Verificar que el test inicial fue completado si se proporciona sessionId
		if (sessionId != null && !sessionId.isEmpty()) {
			var sessionOpt = sessionService.getSession(sessionId);
			if (!sessionOpt.isPresent() || !sessionOpt.get().getInitialTestCompleted()) {
				throw new IllegalArgumentException("Debe completar el test inicial antes de registrarse");
			}
		}
		
		UserEntity u = new UserEntity();
		u.setName(name);
		u.setEmail(email);
		u.setPasswordHash(passwordEncoder.encode(password));
		u.setRole("USER");
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
		return jwtService.generateToken(u.getEmail());
	}

	public String login(String email, String password) {
		UserEntity u = userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("Credenciales inválidas"));
		if (!passwordEncoder.matches(password, u.getPasswordHash())) throw new IllegalArgumentException("Credenciales inválidas");
		return jwtService.generateToken(u.getEmail());
	}
}