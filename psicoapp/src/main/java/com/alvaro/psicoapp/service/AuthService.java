package com.alvaro.psicoapp.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.domain.UserPsychologistEntity;
import com.alvaro.psicoapp.repository.CompanyRepository;
import com.alvaro.psicoapp.repository.TestRepository;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.security.JwtService;
import com.alvaro.psicoapp.util.InputSanitizer;
import com.alvaro.psicoapp.util.ReferralCodeUtil;

@Service
public class AuthService {
	private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
	private final UserRepository userRepository;
	private final CompanyRepository companyRepository;
	private final UserPsychologistRepository userPsychologistRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final TemporarySessionService sessionService;
	private final TestResultService testResultService;
	private final TestRepository testRepository;
	private final EmailService emailService;
	private final TotpService totpService;
	private static final String INITIAL_TEST_CODE = "INITIAL";

	public AuthService(UserRepository userRepository, CompanyRepository companyRepository,
			UserPsychologistRepository userPsychologistRepository, PasswordEncoder passwordEncoder,
			JwtService jwtService, TemporarySessionService sessionService, TestResultService testResultService,
			TestRepository testRepository, EmailService emailService, TotpService totpService) {
		this.userRepository = userRepository;
		this.companyRepository = companyRepository;
		this.userPsychologistRepository = userPsychologistRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.sessionService = sessionService;
		this.testResultService = testResultService;
		this.testRepository = testRepository;
		this.emailService = emailService;
		this.totpService = totpService;
	}

	@Transactional
	public String register(String name, String email, String password, String sessionId, String role,
			String companyReferralCode, String psychologistReferralCode, LocalDate birthDate) {
		var tokenPair = registerWithRefresh(name, email, password, sessionId, role, companyReferralCode, psychologistReferralCode, birthDate);
		return tokenPair.accessToken;
	}

	@Transactional
	public com.alvaro.psicoapp.security.JwtService.TokenPair registerWithRefresh(String name, String email, String password, String sessionId, String role,
			String companyReferralCode, String psychologistReferralCode, LocalDate birthDate) {
		String sanitizedEmail = InputSanitizer.sanitizeEmail(email);
		String sanitizedName = InputSanitizer.sanitizeAndValidate(name != null ? name : "", 100);
		if (sanitizedName.isEmpty()) throw new IllegalArgumentException("El nombre es requerido");

		if (userRepository.existsByEmail(sanitizedEmail)) throw new IllegalArgumentException("Email ya registrado");

		if (RoleConstants.PSYCHOLOGIST.equals(role) && companyReferralCode != null && !companyReferralCode.trim().isEmpty()) {
			String code = companyReferralCode.trim().toUpperCase();
			companyRepository.findByReferralCode(code)
					.orElseThrow(() -> new IllegalArgumentException("Código de empresa no válido"));
		}

		String psychologistSlug = (psychologistReferralCode != null) ? psychologistReferralCode.trim().toLowerCase().replaceAll("[^a-z0-9-]", "") : "";
		boolean hasPsychologistReferral = false;
		if (!psychologistSlug.isEmpty() && (role == null || RoleConstants.USER.equals(role))) {
			var psych = userRepository.findByReferralCode(psychologistSlug);
			if (psych.isPresent() && RoleConstants.PSYCHOLOGIST.equals(psych.get().getRole())) {
				hasPsychologistReferral = true;
			} else if (!psychologistSlug.isEmpty()) {
				throw new IllegalArgumentException("Enlace de registro no válido");
			}
		}

		if (!hasPsychologistReferral && sessionId != null && !sessionId.isEmpty() && (role == null || RoleConstants.USER.equals(role))) {
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
		if (birthDate != null) {
			u.setBirthDate(birthDate);
			u.setAge((int) ChronoUnit.YEARS.between(birthDate, LocalDate.now()));
		}

		if (RoleConstants.PSYCHOLOGIST.equals(role)) {
			if (companyReferralCode != null && !companyReferralCode.trim().isEmpty()) {
				String code = companyReferralCode.trim().toUpperCase();
				var company = companyRepository.findByReferralCode(code)
						.orElseThrow(() -> new IllegalArgumentException("Código de empresa no válido"));
				u.setCompanyId(company.getId());
			}
			String slug = ReferralCodeUtil.nameToSlug(sanitizedName);
			u.setReferralCode(ensureUniqueReferralCode(slug));
		}

		String verificationToken = UUID.randomUUID().toString();
		u.setVerificationToken(verificationToken);
		u.setVerificationTokenExpiresAt(Instant.now().plusSeconds(24 * 60 * 60));

		userRepository.save(u);

		if (hasPsychologistReferral) {
			userRepository.findByReferralCode(psychologistSlug).ifPresent(psych -> {
				UserPsychologistEntity rel = new UserPsychologistEntity();
				rel.setUser(u);
				rel.setPsychologist(psych);
				rel.setStatus("ACTIVE");
				userPsychologistRepository.save(rel);
			});
		}

		if (sessionId != null && !sessionId.isEmpty()) {
			var sessionOpt = sessionService.getSession(sessionId);
			if (sessionOpt.isPresent()) {
				testResultService.transferSessionAnswersToUser(sessionOpt.get(), u);

				var testOpt = testRepository.findByCode(INITIAL_TEST_CODE);
				if (testOpt.isPresent()) {
					testResultService.calculateAndSaveResults(u, null, testOpt.get());
				}

				sessionService.deleteSession(sessionId);
			}
		}

		try {
			boolean isPsychologist = RoleConstants.PSYCHOLOGIST.equals(u.getRole());
			emailService.sendVerificationEmail(u.getEmail(), u.getName(), verificationToken, isPsychologist);
		} catch (Exception e) {
			logger.error("Error enviando correo de verificación", e);

		}

		return jwtService.generateTokenPair(u.getEmail());
	}

	private String ensureUniqueReferralCode(String base) {
		String slug = base;
		int suffix = 0;
		while (userRepository.findByReferralCode(slug).isPresent()) {
			suffix++;
			slug = base + "-" + suffix;
		}
		return slug;
	}

	@Transactional
	public boolean verifyEmail(String token) {
		var userOpt = userRepository.findByVerificationToken(token);
		if (userOpt.isEmpty()) {
			return false;
		}

		UserEntity user = userOpt.get();

		if (user.getVerificationTokenExpiresAt() != null &&
		    user.getVerificationTokenExpiresAt().isBefore(Instant.now())) {
			return false;
		}

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
		var tokenPair = jwtService.generateTokenPair(u.getEmail());
		return tokenPair.accessToken;
	}

	public com.alvaro.psicoapp.security.JwtService.TokenPair loginWithRefresh(String email, String password) {
		String sanitizedEmail = InputSanitizer.sanitizeEmail(email);
		UserEntity u = userRepository.findByEmail(sanitizedEmail).orElseThrow(() -> new IllegalArgumentException("Credenciales inválidas"));
		if (u.getPasswordHash() == null) throw new IllegalArgumentException("Esta cuenta usa inicio de sesión con Google. Usa el botón \"Continuar con Google\".");

		// Account lockout check
		if (u.getAccountLockedUntil() != null && u.getAccountLockedUntil().isAfter(java.time.Instant.now())) {
			long minutesLeft = java.time.Duration.between(java.time.Instant.now(), u.getAccountLockedUntil()).toMinutes() + 1;
			throw new IllegalArgumentException("Cuenta bloqueada temporalmente. Intenta en " + minutesLeft + " minutos.");
		}

		if (!passwordEncoder.matches(password, u.getPasswordHash())) {
			// Increment failed attempts
			int attempts = (u.getFailedLoginAttempts() != null ? u.getFailedLoginAttempts() : 0) + 1;
			u.setFailedLoginAttempts(attempts);
			if (attempts >= 5) {
				u.setAccountLockedUntil(java.time.Instant.now().plusSeconds(15 * 60));
				userRepository.save(u);
				throw new IllegalArgumentException("Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intenta en 15 minutos.");
			}
			userRepository.save(u);
			throw new IllegalArgumentException("Credenciales inválidas");
		}

		// Reset failed attempts on successful login
		if (u.getFailedLoginAttempts() != null && u.getFailedLoginAttempts() > 0) {
			u.setFailedLoginAttempts(0);
			u.setAccountLockedUntil(null);
			userRepository.save(u);
		}

		// 2FA check
		if (Boolean.TRUE.equals(u.getTotpEnabled())) {
			// Return a special temporary token indicating 2FA is required
			String tempToken = jwtService.generateAccessToken(u.getEmail());
			throw new TwoFactorRequiredException(tempToken);
		}

		return jwtService.generateTokenPair(u.getEmail());
	}

	public com.alvaro.psicoapp.security.JwtService.TokenPair verify2FA(String tempToken, String totpCode) {
		try {
			String email = jwtService.parseSubject(tempToken);
			UserEntity u = userRepository.findByEmail(email)
					.orElseThrow(() -> new IllegalArgumentException("Token inválido"));
			if (!Boolean.TRUE.equals(u.getTotpEnabled()) || u.getTotpSecret() == null) {
				throw new IllegalArgumentException("2FA no está habilitado para esta cuenta");
			}
			if (!totpService.verifyCode(u.getTotpSecret(), totpCode)) {
				throw new IllegalArgumentException("Código 2FA inválido");
			}
			return jwtService.generateTokenPair(u.getEmail());
		} catch (TwoFactorRequiredException e) {
			throw e;
		} catch (IllegalArgumentException e) {
			throw e;
		} catch (Exception e) {
			throw new IllegalArgumentException("Token temporal inválido o expirado");
		}
	}

	public static class TwoFactorRequiredException extends RuntimeException {
		private final String tempToken;
		public TwoFactorRequiredException(String tempToken) {
			super("Se requiere autenticación de dos factores");
			this.tempToken = tempToken;
		}
		public String getTempToken() { return tempToken; }
	}

	public String refreshAccessToken(String refreshToken) {
		try {
			String email = jwtService.parseRefreshToken(refreshToken);
			return jwtService.generateAccessToken(email);
		} catch (Exception e) {
			logger.warn("Error refrescando token: {}", e.getMessage());
			throw new IllegalArgumentException("Refresh token inválido o expirado");
		}
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
			var tokenPair = jwtService.generateTokenPair(u.getEmail());
			return tokenPair.accessToken;
		}

		var existingEmail = userRepository.findByEmail(sanitizedEmail);
		if (existingEmail.isPresent()) {
			UserEntity u = existingEmail.get();
			u.setOauth2Provider(provider);
			u.setOauth2ProviderId(providerId);
			if (avatarUrl != null && !avatarUrl.isEmpty()) u.setAvatarUrl(avatarUrl);
			u.setEmailVerified(true);
			userRepository.save(u);
			var tokenPair = jwtService.generateTokenPair(u.getEmail());
			return tokenPair.accessToken;
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
		var tokenPair = jwtService.generateTokenPair(u.getEmail());
		return tokenPair.accessToken;
	}

	@Transactional
	public com.alvaro.psicoapp.security.JwtService.TokenPair processOAuth2UserWithRefresh(String provider, String providerId, String email, String name, String avatarUrl) {
		String sanitizedEmail = InputSanitizer.sanitizeEmail(email);
		String sanitizedName = InputSanitizer.sanitizeAndValidate(name != null ? name : "", 100);
		if (sanitizedName.isEmpty()) sanitizedName = "Usuario";

		var existingOAuth = userRepository.findByOauth2ProviderAndOauth2ProviderId(provider, providerId);
		if (existingOAuth.isPresent()) {
			UserEntity u = existingOAuth.get();
			if (avatarUrl != null && !avatarUrl.isEmpty()) u.setAvatarUrl(avatarUrl);
			if (sanitizedName != null && !sanitizedName.isEmpty()) u.setName(sanitizedName);
			userRepository.save(u);
			return jwtService.generateTokenPair(u.getEmail());
		}

		var existingEmail = userRepository.findByEmail(sanitizedEmail);
		if (existingEmail.isPresent()) {
			UserEntity u = existingEmail.get();
			u.setOauth2Provider(provider);
			u.setOauth2ProviderId(providerId);
			if (avatarUrl != null && !avatarUrl.isEmpty()) u.setAvatarUrl(avatarUrl);
			u.setEmailVerified(true);
			userRepository.save(u);
			return jwtService.generateTokenPair(u.getEmail());
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
		return jwtService.generateTokenPair(u.getEmail());
	}

	@Transactional
	public void requestPasswordReset(String email) {
		String sanitizedEmail = InputSanitizer.sanitizeEmail(email);
		UserEntity user = userRepository.findByEmail(sanitizedEmail)
			.orElseThrow(() -> new IllegalArgumentException("No existe una cuenta con ese email"));

		String resetToken = UUID.randomUUID().toString();
		user.setPasswordResetToken(resetToken);
		user.setPasswordResetTokenExpiresAt(Instant.now().plusSeconds(60 * 60));

		userRepository.save(user);

		try {
			emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetToken);
		} catch (Exception e) {
			logger.error("Error enviando correo de recuperación de contraseña", e);

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

		if (user.getPasswordResetTokenExpiresAt() != null &&
		    user.getPasswordResetTokenExpiresAt().isBefore(Instant.now())) {
			return false;
		}

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

		if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
			throw new IllegalArgumentException("Contraseña actual incorrecta");
		}

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

		String verificationToken = UUID.randomUUID().toString();
		user.setVerificationToken(verificationToken);
		user.setVerificationTokenExpiresAt(Instant.now().plusSeconds(24 * 60 * 60));
		userRepository.save(user);

		try {
			boolean isPsychologist = RoleConstants.PSYCHOLOGIST.equals(user.getRole());
			emailService.resendVerificationEmail(user.getEmail(), user.getName(), verificationToken, isPsychologist);
		} catch (Exception e) {
			logger.error("Error reenviando correo de verificación", e);
			throw new RuntimeException("Error al reenviar el correo de verificación", e);
		}
	}
}
