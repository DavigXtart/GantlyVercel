package com.alvaro.psicoapp.service;

import java.time.Instant;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.TestRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.security.JwtService;
import com.alvaro.psicoapp.util.InputSanitizer;

@Service
public class AuthService {
	private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final TemporarySessionService sessionService;
	private final TestResultService testResultService;
	private final TestRepository testRepository;
	private final EmailService emailService;
	private static final String INITIAL_TEST_CODE = "INITIAL";

	public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
			JwtService jwtService, TemporarySessionService sessionService, TestResultService testResultService,
			TestRepository testRepository, EmailService emailService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.sessionService = sessionService;
		this.testResultService = testResultService;
		this.testRepository = testRepository;
		this.emailService = emailService;
	}

	@Transactional
	public String register(String name, String email, String password, String sessionId, String role) {
		String sanitizedEmail = InputSanitizer.sanitizeEmail(email);
		String sanitizedName = InputSanitizer.sanitizeAndValidate(name != null ? name : "", 100);
		if (sanitizedName.isEmpty()) throw new IllegalArgumentException("El nombre es requerido");

		if (userRepository.existsByEmail(sanitizedEmail)) throw new IllegalArgumentException("Email ya registrado");
		
		// Verificar que el test inicial fue completado si se proporciona sessionId (solo para usuarios)
		if (sessionId != null && !sessionId.isEmpty() && (role == null || RoleConstants.USER.equals(role))) {
			var sessionOpt = sessionService.getSession(sessionId);
			if (!sessionOpt.isPresent() || !sessionOpt.get().getInitialTestCompleted()) {
				throw new IllegalArgumentException("Debe completar el test inicial antes de registrarse");
			}
		}
		
		UserEntity u = new UserEntity();
		u.setName(sanitizedName);
		u.setEmail(sanitizedEmail);
		u.setPasswordHash(passwordEncoder.encode(password));
		u.setRole(role != null && !role.isEmpty() ? role : RoleConstants.USER);
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
			boolean isPsychologist = RoleConstants.PSYCHOLOGIST.equals(u.getRole());
			emailService.sendVerificationEmail(u.getEmail(), u.getName(), verificationToken, isPsychologist);
		} catch (Exception e) {
			logger.error("Error enviando correo de verificación", e);
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

	public com.alvaro.psicoapp.dto.AuthDtos.MeResponse getMe(String email) {
		return userRepository.findByEmail(email)
			.map(u -> new com.alvaro.psicoapp.dto.AuthDtos.MeResponse(
					u.getEmail(), u.getRole(), u.getName(), Boolean.TRUE.equals(u.getEmailVerified())))
			.orElse(null);
	}

	public String login(String email, String password) {
		String sanitizedEmail = InputSanitizer.sanitizeEmail(email);
		UserEntity u = userRepository.findByEmail(sanitizedEmail).orElseThrow(() -> new IllegalArgumentException("Credenciales inválidas"));
		if (u.getPasswordHash() == null) throw new IllegalArgumentException("Esta cuenta usa inicio de sesión con Google. Usa el botón \"Continuar con Google\".");
		if (!passwordEncoder.matches(password, u.getPasswordHash())) throw new IllegalArgumentException("Credenciales inválidas");
		return jwtService.generateToken(u.getEmail());
	}

	@Transactional
	public String processOAuth2User(String provider, String providerId, String email, String name, String avatarUrl) {
		String sanitizedEmail = InputSanitizer.sanitizeEmail(email);
		String sanitizedName = InputSanitizer.sanitizeAndValidate(name != null ? name : "", 100);
		if (sanitizedName.isEmpty()) sanitizedName = "Usuario";

		var existingOAuth = userRepository.findByOauth2ProviderAndOauth2ProviderId(provider, providerId);
		if (existingOAuth.isPresent()) {
			UserEntity u = existingOAuth.get();
			if (avatarUrl != null && !avatarUrl.isEmpty()) u.setAvatarUrl(avatarUrl);
			if (sanitizedName != null && !sanitizedName.isEmpty()) u.setName(sanitizedName);
			userRepository.save(u);
			return jwtService.generateToken(u.getEmail());
		}

		var existingEmail = userRepository.findByEmail(sanitizedEmail);
		if (existingEmail.isPresent()) {
			UserEntity u = existingEmail.get();
			u.setOauth2Provider(provider);
			u.setOauth2ProviderId(providerId);
			if (avatarUrl != null && !avatarUrl.isEmpty()) u.setAvatarUrl(avatarUrl);
			u.setEmailVerified(true);
			userRepository.save(u);
			return jwtService.generateToken(u.getEmail());
		}

		UserEntity u = new UserEntity();
		u.setName(sanitizedName);
		u.setEmail(sanitizedEmail);
		u.setPasswordHash(null);
		u.setOauth2Provider(provider);
		u.setOauth2ProviderId(providerId);
		u.setAvatarUrl(avatarUrl);
		u.setRole(RoleConstants.USER);
		u.setEmailVerified(true);
		userRepository.save(u);
		return jwtService.generateToken(u.getEmail());
	}

	@Transactional
	public void requestPasswordReset(String email) {
		String sanitizedEmail = InputSanitizer.sanitizeEmail(email);
		UserEntity user = userRepository.findByEmail(sanitizedEmail)
			.orElseThrow(() -> new IllegalArgumentException("No existe una cuenta con ese email"));
		
		// Generar token de reset
		String resetToken = UUID.randomUUID().toString();
		user.setPasswordResetToken(resetToken);
		user.setPasswordResetTokenExpiresAt(Instant.now().plusSeconds(60 * 60)); // 1 hora
		
		userRepository.save(user);
		
		// Enviar email de reset
		try {
			emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetToken);
		} catch (Exception e) {
			logger.error("Error enviando correo de recuperación de contraseña", e);
			// No lanzar excepción para evitar que usuarios descubran emails válidos
		}
	}

	@Transactional
	public boolean resetPassword(String token, String newPassword) {
		if (newPassword == null || newPassword.length() < 6) {
			throw new IllegalArgumentException("La contraseña debe tener al menos 6 caracteres");
		}
		var userOpt = userRepository.findByPasswordResetToken(token);
		if (userOpt.isEmpty()) {
			return false;
		}
		
		UserEntity user = userOpt.get();
		
		// Verificar que el token no haya expirado
		if (user.getPasswordResetTokenExpiresAt() != null && 
		    user.getPasswordResetTokenExpiresAt().isBefore(Instant.now())) {
			return false;
		}
		
		// Cambiar la contraseña
		user.setPasswordHash(passwordEncoder.encode(newPassword));
		user.setPasswordResetToken(null);
		user.setPasswordResetTokenExpiresAt(null);
		userRepository.save(user);
		
		return true;
	}

	@Transactional
	public void changePassword(String email, String currentPassword, String newPassword) {
		if (newPassword == null || newPassword.length() < 6) {
			throw new IllegalArgumentException("La nueva contraseña debe tener al menos 6 caracteres");
		}
		UserEntity user = userRepository.findByEmail(email)
			.orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
		
		// Verificar contraseña actual
		if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
			throw new IllegalArgumentException("Contraseña actual incorrecta");
		}
		
		// Cambiar la contraseña
		user.setPasswordHash(passwordEncoder.encode(newPassword));
		userRepository.save(user);
	}

	@Transactional
	public void resendVerificationEmail(String email) {
		UserEntity user = userRepository.findByEmail(email)
			.orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
		
		if (user.getEmailVerified()) {
			throw new IllegalArgumentException("El email ya está verificado");
		}
		
		// Generar nuevo token de verificación
		String verificationToken = UUID.randomUUID().toString();
		user.setVerificationToken(verificationToken);
		user.setVerificationTokenExpiresAt(Instant.now().plusSeconds(24 * 60 * 60)); // 24 horas
		userRepository.save(user);
		
		// Reenviar email
		try {
			boolean isPsychologist = RoleConstants.PSYCHOLOGIST.equals(user.getRole());
			emailService.resendVerificationEmail(user.getEmail(), user.getName(), verificationToken, isPsychologist);
		} catch (Exception e) {
			logger.error("Error reenviando correo de verificación", e);
			throw new RuntimeException("Error al reenviar el correo de verificación", e);
		}
	}
}