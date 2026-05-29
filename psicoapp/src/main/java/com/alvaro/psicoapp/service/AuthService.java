package com.alvaro.psicoapp.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.alvaro.psicoapp.domain.PsychologistProfileEntity;
import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.domain.UserPsychologistEntity;
import com.alvaro.psicoapp.domain.ClinicInvitationEntity;
import com.alvaro.psicoapp.repository.ClinicInvitationRepository;
import com.alvaro.psicoapp.repository.CompanyRepository;
import com.alvaro.psicoapp.repository.PsychologistProfileRepository;
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
	private final PsychologistProfileRepository psychologistProfileRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final TemporarySessionService sessionService;
	private final TestResultService testResultService;
	private final TestRepository testRepository;
	private final EmailService emailService;
	private final TotpService totpService;
	private final ClinicInvitationRepository clinicInvitationRepository;
	private final SecurityBreachService securityBreachService;
	private static final String INITIAL_TEST_CODE = "INITIAL";
	private static final SecureRandom SECURE_RANDOM = new SecureRandom();

	// Password validation
	private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
	private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{}|;:',.<>?/]");

	// Verification code rate limiting per email
	private static final int MAX_VERIFICATION_ATTEMPTS = 5;
	private static final long VERIFICATION_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
	private final Map<String, VerificationAttemptTracker> verificationAttempts = new ConcurrentHashMap<>();

	// Lockout escalation durations in seconds
	private static final long[] LOCKOUT_DURATIONS = {
		15 * 60,      // 1st lockout: 15 minutes
		60 * 60,      // 2nd lockout: 1 hour
		4 * 60 * 60,  // 3rd lockout: 4 hours
		24 * 60 * 60  // 4th+: 24 hours
	};

	public AuthService(UserRepository userRepository, CompanyRepository companyRepository,
			UserPsychologistRepository userPsychologistRepository,
			PsychologistProfileRepository psychologistProfileRepository,
			PasswordEncoder passwordEncoder,
			JwtService jwtService, TemporarySessionService sessionService, TestResultService testResultService,
			TestRepository testRepository, EmailService emailService, TotpService totpService,
			ClinicInvitationRepository clinicInvitationRepository,
			SecurityBreachService securityBreachService) {
		this.userRepository = userRepository;
		this.companyRepository = companyRepository;
		this.userPsychologistRepository = userPsychologistRepository;
		this.psychologistProfileRepository = psychologistProfileRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.sessionService = sessionService;
		this.testResultService = testResultService;
		this.testRepository = testRepository;
		this.emailService = emailService;
		this.totpService = totpService;
		this.clinicInvitationRepository = clinicInvitationRepository;
		this.securityBreachService = securityBreachService;
	}

	@Transactional
	public com.alvaro.psicoapp.security.JwtService.TokenPair registerWithRefresh(String name, String email, String password, String sessionId, String role,
			String companyReferralCode, String psychologistReferralCode, LocalDate birthDate, String inviteToken) {
		return registerWithRefresh(name, email, password, sessionId, role, companyReferralCode, psychologistReferralCode, birthDate, inviteToken, null);
	}

	@Transactional
	public com.alvaro.psicoapp.security.JwtService.TokenPair registerWithRefresh(String name, String email, String password, String sessionId, String role,
			String companyReferralCode, String psychologistReferralCode, LocalDate birthDate, String inviteToken, Boolean gdprConsent) {
		return registerWithRefresh(name, email, password, sessionId, role, companyReferralCode, psychologistReferralCode, birthDate, inviteToken, gdprConsent, null);
	}

	@Transactional
	public com.alvaro.psicoapp.security.JwtService.TokenPair registerWithRefresh(String name, String email, String password, String sessionId, String role,
			String companyReferralCode, String psychologistReferralCode, LocalDate birthDate, String inviteToken, Boolean gdprConsent, Boolean healthDataConsent) {
		return registerWithRefresh(name, email, password, sessionId, role, companyReferralCode, psychologistReferralCode, birthDate, inviteToken, gdprConsent, healthDataConsent, null);
	}

	@Transactional
	public com.alvaro.psicoapp.security.JwtService.TokenPair registerWithRefresh(String name, String email, String password, String sessionId, String role,
			String companyReferralCode, String psychologistReferralCode, LocalDate birthDate, String inviteToken, Boolean gdprConsent, Boolean healthDataConsent, String guardianEmail) {
		return registerWithRefresh(name, email, password, sessionId, role, companyReferralCode, psychologistReferralCode, birthDate, inviteToken, gdprConsent, healthDataConsent, guardianEmail, null, null, null, null);
	}

	@Transactional
	public com.alvaro.psicoapp.security.JwtService.TokenPair registerWithRefresh(String name, String email, String password, String sessionId, String role,
			String companyReferralCode, String psychologistReferralCode, LocalDate birthDate, String inviteToken, Boolean gdprConsent, Boolean healthDataConsent, String guardianEmail,
			String phone, String licenseNumber, String experienceYears, String specialization) {
		if (!Boolean.TRUE.equals(gdprConsent)) {
			throw new IllegalArgumentException("Debes aceptar la politica de privacidad");
		}
		if (!Boolean.TRUE.equals(healthDataConsent)) {
			throw new IllegalArgumentException("Debes consentir el tratamiento de datos de salud");
		}

		// RGPD-7: Minors under 14 require guardian email (Art. 8 RGPD, LOPDGDD Art. 7)
		if (birthDate != null) {
			long age = ChronoUnit.YEARS.between(birthDate, LocalDate.now());
			if (age < 14 && (guardianEmail == null || guardianEmail.trim().isEmpty())) {
				throw new IllegalArgumentException("Los menores de 14 años requieren el email de un tutor legal");
			}
		}

		String sanitizedEmail = InputSanitizer.sanitizeEmail(email);
		String sanitizedName = InputSanitizer.sanitizeAndValidate(name != null ? name : "", 100);
		if (sanitizedName.isEmpty()) throw new IllegalArgumentException("El nombre es requerido");
		validatePassword(password);

		var existingUser = userRepository.findByEmail(sanitizedEmail);
		if (existingUser.isPresent()) {
			if (Boolean.TRUE.equals(existingUser.get().getEmailVerified())) {
				throw new IllegalArgumentException("Email ya registrado");
			}
			// Remove unverified account so user can re-register
			userRepository.delete(existingUser.get());
			userRepository.flush();
		}

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
		// RGPD-7: Store guardian email for minors
		if (guardianEmail != null && !guardianEmail.trim().isEmpty()) {
			u.setGuardianEmail(InputSanitizer.sanitizeEmail(guardianEmail));
		}
		// Store phone for psychologist registration
		if (phone != null && !phone.trim().isEmpty()) {
			u.setPhone(phone.trim());
		}

		if (RoleConstants.PSYCHOLOGIST.equals(role)) {
			if (companyReferralCode != null && !companyReferralCode.trim().isEmpty()) {
				String code = companyReferralCode.trim().toUpperCase();
				var company = companyRepository.findByReferralCode(code)
						.orElseThrow(() -> new IllegalArgumentException("Código de empresa no válido"));
				u.setCompanyId(company.getId());
			}
			// Handle invite token - associate psychologist with invited company
			if (inviteToken != null && !inviteToken.trim().isEmpty()) {
				var inv = clinicInvitationRepository.findByToken(inviteToken.trim())
						.orElseThrow(() -> new IllegalArgumentException("Token de invitacion no valido"));
				if (!"PENDING".equals(inv.getStatus()) || inv.getExpiresAt().isBefore(Instant.now())) {
					throw new IllegalArgumentException("La invitacion ha expirado");
				}
				// Override companyId from invitation
				u.setCompanyId(inv.getCompanyId());
				// Mark invitation as accepted after user is saved
				inv.setStatus("ACCEPTED");
				clinicInvitationRepository.save(inv);
			}
			String slug = ReferralCodeUtil.nameToSlug(sanitizedName);
			u.setReferralCode(ensureUniqueReferralCode(slug));
		}

		u.setGdprConsentAt(Instant.now());
		u.setGdprConsentVersion("1.0");
		u.setHealthDataConsentAt(Instant.now());

		String verificationToken = UUID.randomUUID().toString();
		String verificationCode = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
		u.setVerificationToken(verificationToken);
		u.setVerificationCode(verificationCode);
		u.setVerificationTokenExpiresAt(Instant.now().plusSeconds(24 * 60 * 60));

		userRepository.save(u);

		if (RoleConstants.PSYCHOLOGIST.equals(u.getRole())) {
			PsychologistProfileEntity profile = new PsychologistProfileEntity();
			profile.setUser(u);
			profile.setApproved(false);
			if (licenseNumber != null && !licenseNumber.trim().isEmpty()) {
				profile.setLicenseNumber(licenseNumber.trim());
			}
			if (experienceYears != null && !experienceYears.trim().isEmpty()) {
				profile.setExperience(experienceYears.trim());
			}
			if (specialization != null && !specialization.trim().isEmpty()) {
				profile.setSpecializations("[\"" + specialization.trim().replace("\"", "\\\"") + "\"]");
			}
			psychologistProfileRepository.save(profile);
		}

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
				testResultService.extractProfileFromInitialTest(u);

				var testOpt = testRepository.findByCode(INITIAL_TEST_CODE);
				if (testOpt.isPresent()) {
					testResultService.calculateAndSaveResults(u, null, testOpt.get());
				}

				sessionService.deleteSession(sessionId);
			}
		}

		try {
			boolean isPsychologist = RoleConstants.PSYCHOLOGIST.equals(u.getRole());
			emailService.sendVerificationEmail(u.getEmail(), u.getName(), verificationToken, verificationCode, isPsychologist);
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
		user.setVerificationCode(null);
		user.setVerificationTokenExpiresAt(null);
		userRepository.save(user);

		return true;
	}

	@Transactional
	public boolean verifyEmailByCode(String email, String code) {
		if (code == null || code.trim().isEmpty()) return false;
		String sanitizedEmail = InputSanitizer.sanitizeEmail(email);

		// Per-email rate limiting for verification attempts
		VerificationAttemptTracker tracker = verificationAttempts.computeIfAbsent(
			sanitizedEmail, k -> new VerificationAttemptTracker());
		if (tracker.isLocked()) {
			throw new IllegalArgumentException("Demasiados intentos de verificación. Intenta en 15 minutos.");
		}

		var userOpt = userRepository.findByEmail(sanitizedEmail);
		if (userOpt.isEmpty()) return false;

		UserEntity user = userOpt.get();
		if (Boolean.TRUE.equals(user.getEmailVerified())) return true;
		if (user.getVerificationCode() == null) return false;

		if (user.getVerificationTokenExpiresAt() != null &&
		    user.getVerificationTokenExpiresAt().isBefore(Instant.now())) {
			return false;
		}

		if (!user.getVerificationCode().equals(code.trim())) {
			int attempts = tracker.incrementAndGet();
			if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
				tracker.lock(VERIFICATION_LOCKOUT_MS);
				logger.warn("Verificación bloqueada para email: {} tras {} intentos fallidos", sanitizedEmail, attempts);
			}
			return false;
		}

		// Successful verification - reset tracker
		tracker.reset();
		verificationAttempts.remove(sanitizedEmail);

		user.setEmailVerified(true);
		user.setVerificationToken(null);
		user.setVerificationCode(null);
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

	public com.alvaro.psicoapp.security.JwtService.TokenPair loginWithRefresh(String email, String password) {
		String sanitizedEmail = InputSanitizer.sanitizeEmail(email);
		UserEntity u = userRepository.findByEmail(sanitizedEmail).orElseThrow(() -> new IllegalArgumentException("Credenciales inválidas"));
		if (u.getPasswordHash() == null) throw new IllegalArgumentException("Esta cuenta usa inicio de sesión con Google. Usa el botón \"Continuar con Google\".");

		// Account lockout check
		if (u.getAccountLockedUntil() != null && u.getAccountLockedUntil().isAfter(Instant.now())) {
			long minutesLeft = java.time.Duration.between(Instant.now(), u.getAccountLockedUntil()).toMinutes() + 1;
			throw new IllegalArgumentException("Cuenta bloqueada temporalmente. Intenta en " + minutesLeft + " minutos.");
		}

		if (!passwordEncoder.matches(password, u.getPasswordHash())) {
			// Increment failed attempts
			int attempts = (u.getFailedLoginAttempts() != null ? u.getFailedLoginAttempts() : 0) + 1;
			u.setFailedLoginAttempts(attempts);
			if (attempts >= 5) {
				// Escalating lockout: 15min -> 1h -> 4h -> 24h
				int lockoutCount = (u.getLockoutCount() != null ? u.getLockoutCount() : 0) + 1;
				u.setLockoutCount(lockoutCount);
				long lockoutSeconds = getLockoutDuration(lockoutCount - 1);
				u.setAccountLockedUntil(Instant.now().plusSeconds(lockoutSeconds));
				u.setFailedLoginAttempts(0); // Reset attempts for next lockout cycle
				userRepository.save(u);
				securityBreachService.logPotentialBreach("ACCOUNT_LOCKOUT",
					"Account locked for user (lockout #" + lockoutCount + "): " + sanitizedEmail, "N/A");
				long lockoutMinutes = lockoutSeconds / 60;
				String timeMsg = lockoutMinutes >= 60
					? (lockoutMinutes / 60) + " hora" + (lockoutMinutes / 60 > 1 ? "s" : "")
					: lockoutMinutes + " minutos";
				throw new IllegalArgumentException("Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intenta en " + timeMsg + ".");
			}
			userRepository.save(u);
			throw new IllegalArgumentException("Credenciales inválidas");
		}

		// Reset failed attempts and lockout count on successful login
		if ((u.getFailedLoginAttempts() != null && u.getFailedLoginAttempts() > 0) ||
		    (u.getLockoutCount() != null && u.getLockoutCount() > 0)) {
			u.setFailedLoginAttempts(0);
			u.setLockoutCount(0);
			u.setAccountLockedUntil(null);
			userRepository.save(u);
		}

		// Email verification check
		if (!Boolean.TRUE.equals(u.getEmailVerified())) {
			throw new IllegalArgumentException("EMAIL_NOT_VERIFIED");
		}

		// Psychologist approval check
		if (RoleConstants.PSYCHOLOGIST.equals(u.getRole())) {
			var profile = psychologistProfileRepository.findByUser_Id(u.getId());
			if (profile.isEmpty() || !Boolean.TRUE.equals(profile.get().getApproved())) {
				throw new IllegalArgumentException("PSYCHOLOGIST_PENDING_APPROVAL");
			}
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
			// PiiEncryptConverter on the entity handles decryption transparently
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

	/**
	 * Refresh token rotation: generates a new access+refresh token pair.
	 * The caller is responsible for blacklisting the old refresh token.
	 */
	public com.alvaro.psicoapp.security.JwtService.TokenPair refreshTokenPair(String refreshToken) {
		try {
			String email = jwtService.parseRefreshToken(refreshToken);
			return jwtService.generateTokenPair(email);
		} catch (Exception e) {
			logger.warn("Error rotando refresh token: {}", e.getMessage());
			throw new IllegalArgumentException("Refresh token inválido o expirado");
		}
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
		validatePassword(newPassword);
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
		validatePassword(newPassword);
		UserEntity user = userRepository.findByEmail(email)
			.orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

		if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
			throw new IllegalArgumentException("Contraseña actual incorrecta");
		}

		user.setPasswordHash(passwordEncoder.encode(newPassword));
		userRepository.save(user);
	}

	private void validatePassword(String password) {
		if (password == null || password.length() < 10) {
			throw new IllegalArgumentException("La contraseña debe tener al menos 10 caracteres");
		}
		if (!UPPERCASE_PATTERN.matcher(password).find()) {
			throw new IllegalArgumentException("La contraseña debe contener al menos una letra mayúscula");
		}
		if (!SPECIAL_CHAR_PATTERN.matcher(password).find()) {
			throw new IllegalArgumentException("La contraseña debe contener al menos un símbolo especial (!@#$%^&*()_+-=[]{}|;:',.<>?/)");
		}
	}

	private long getLockoutDuration(int lockoutCount) {
		int index = Math.min(lockoutCount, LOCKOUT_DURATIONS.length - 1);
		return LOCKOUT_DURATIONS[Math.max(0, index)];
	}

	private static class VerificationAttemptTracker {
		private final AtomicInteger attempts = new AtomicInteger(0);
		private volatile long lockedUntil = 0;

		boolean isLocked() {
			return lockedUntil > System.currentTimeMillis();
		}

		int incrementAndGet() {
			return attempts.incrementAndGet();
		}

		void lock(long durationMs) {
			lockedUntil = System.currentTimeMillis() + durationMs;
		}

		void reset() {
			attempts.set(0);
			lockedUntil = 0;
		}
	}

	@Transactional
	public void resendVerificationEmail(String email) {
		UserEntity user = userRepository.findByEmail(email)
			.orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

		if (user.getEmailVerified()) {
			throw new IllegalArgumentException("El email ya está verificado");
		}

		String verificationToken = UUID.randomUUID().toString();
		String verificationCode = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
		user.setVerificationToken(verificationToken);
		user.setVerificationCode(verificationCode);
		user.setVerificationTokenExpiresAt(Instant.now().plusSeconds(24 * 60 * 60));
		userRepository.save(user);

		try {
			boolean isPsychologist = RoleConstants.PSYCHOLOGIST.equals(user.getRole());
			emailService.sendVerificationEmail(user.getEmail(), user.getName(), verificationToken, verificationCode, isPsychologist);
		} catch (Exception e) {
			logger.error("Error reenviando correo de verificación", e);
			throw new RuntimeException("Error al reenviar el correo de verificación", e);
		}
	}
}
