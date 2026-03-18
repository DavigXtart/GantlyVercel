package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.TemporarySessionEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.CompanyRepository;
import com.alvaro.psicoapp.repository.TestRepository;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private UserPsychologistRepository userPsychologistRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private TemporarySessionService sessionService;

    @Mock
    private TestResultService testResultService;

    @Mock
    private TestRepository testRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private TotpService totpService;

    private AuthService authService;

    private UserEntity testUser;
    private JwtService.TokenPair testTokenPair;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                companyRepository,
                userPsychologistRepository,
                passwordEncoder,
                jwtService,
                sessionService,
                testResultService,
                testRepository,
                emailService,
                totpService
        );

        testUser = new UserEntity();
        testUser.setId(1L);
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");
        testUser.setPasswordHash("encoded-password");
        testUser.setRole("USER");
        testUser.setEmailVerified(false);
        testUser.setFailedLoginAttempts(0);
        testUser.setTotpEnabled(false);

        testTokenPair = new JwtService.TokenPair("access-token", "refresh-token");
    }

    // ── registerWithRefresh ─────────────────────────────────────────────

    @Test
    @DisplayName("registerWithRefresh - successful registration for USER role")
    void registerWithRefresh_success_savesUserAndReturnsTokens() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");
        when(jwtService.generateTokenPair("test@example.com")).thenReturn(testTokenPair);

        TemporarySessionEntity session = new TemporarySessionEntity();
        session.setSessionId("session-1");
        session.setInitialTestCompleted(true);
        when(sessionService.getSession("session-1")).thenReturn(Optional.of(session));

        lenient().when(testRepository.findByCode("INITIAL")).thenReturn(Optional.empty());

        JwtService.TokenPair result = authService.registerWithRefresh(
                "Test User", "test@example.com", "password123",
                "session-1", "USER", null, null, null
        );

        assertNotNull(result);
        assertEquals("access-token", result.accessToken);
        assertEquals("refresh-token", result.refreshToken);

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(userRepository).save(captor.capture());

        UserEntity saved = captor.getValue();
        assertEquals("Test User", saved.getName());
        assertEquals("test@example.com", saved.getEmail());
        assertEquals("encoded-password", saved.getPasswordHash());
        assertEquals("USER", saved.getRole());
        assertFalse(saved.getEmailVerified());
        assertNotNull(saved.getVerificationToken());
        assertNotNull(saved.getVerificationCode());
        assertNotNull(saved.getVerificationTokenExpiresAt());

        verify(emailService).sendVerificationEmail(
                eq("test@example.com"), eq("Test User"),
                anyString(), anyString(), eq(false)
        );
    }

    @Test
    @DisplayName("registerWithRefresh - throws on duplicate email")
    void registerWithRefresh_duplicateEmail_throws() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                authService.registerWithRefresh(
                        "Test User", "test@example.com", "password123",
                        null, "USER", null, null, null
                )
        );

        assertEquals("Email ya registrado", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("registerWithRefresh - throws when name is null")
    void registerWithRefresh_nullName_throws() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                authService.registerWithRefresh(
                        null, "test@example.com", "password123",
                        null, "USER", null, null, null
                )
        );

        assertEquals("El nombre es requerido", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("registerWithRefresh - throws when name is empty string")
    void registerWithRefresh_emptyName_throws() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                authService.registerWithRefresh(
                        "", "test@example.com", "password123",
                        null, "USER", null, null, null
                )
        );

        assertEquals("El nombre es requerido", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    // ── loginWithRefresh ────────────────────────────────────────────────

    @Test
    @DisplayName("loginWithRefresh - successful login returns token pair")
    void loginWithRefresh_success_returnsTokens() {
        testUser.setEmailVerified(true);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", "encoded-password")).thenReturn(true);
        when(jwtService.generateTokenPair("test@example.com")).thenReturn(testTokenPair);

        JwtService.TokenPair result = authService.loginWithRefresh("test@example.com", "password123");

        assertNotNull(result);
        assertEquals("access-token", result.accessToken);
        assertEquals("refresh-token", result.refreshToken);
    }

    @Test
    @DisplayName("loginWithRefresh - resets failed attempts on successful login")
    void loginWithRefresh_success_resetsFailedAttempts() {
        testUser.setEmailVerified(true);
        testUser.setFailedLoginAttempts(3);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", "encoded-password")).thenReturn(true);
        when(jwtService.generateTokenPair("test@example.com")).thenReturn(testTokenPair);

        authService.loginWithRefresh("test@example.com", "password123");

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(userRepository).save(captor.capture());

        UserEntity saved = captor.getValue();
        assertEquals(0, saved.getFailedLoginAttempts());
        assertNull(saved.getAccountLockedUntil());
    }

    @Test
    @DisplayName("loginWithRefresh - blocks unverified email")
    void loginWithRefresh_unverifiedEmail_throws() {
        testUser.setEmailVerified(false);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", "encoded-password")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> authService.loginWithRefresh("test@example.com", "password123"));
        assertTrue(ex.getMessage().contains("EMAIL_NOT_VERIFIED"));
    }

    @Test
    @DisplayName("loginWithRefresh - wrong password increments failed attempts")
    void loginWithRefresh_wrongPassword_incrementsFailedAttempts() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongpass", "encoded-password")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                authService.loginWithRefresh("test@example.com", "wrongpass")
        );

        assertEquals("Credenciales inválidas", ex.getMessage());

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(userRepository).save(captor.capture());
        assertEquals(1, captor.getValue().getFailedLoginAttempts());
    }

    @Test
    @DisplayName("loginWithRefresh - locks account after 5 failed attempts")
    void loginWithRefresh_fifthFailedAttempt_locksAccount() {
        testUser.setFailedLoginAttempts(4);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongpass", "encoded-password")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                authService.loginWithRefresh("test@example.com", "wrongpass")
        );

        assertTrue(ex.getMessage().contains("Cuenta bloqueada temporalmente"));

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(userRepository).save(captor.capture());

        UserEntity saved = captor.getValue();
        assertEquals(5, saved.getFailedLoginAttempts());
        assertNotNull(saved.getAccountLockedUntil());
        assertTrue(saved.getAccountLockedUntil().isAfter(Instant.now()));
    }

    @Test
    @DisplayName("loginWithRefresh - throws when account is locked")
    void loginWithRefresh_accountLocked_throws() {
        testUser.setAccountLockedUntil(Instant.now().plusSeconds(600));
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                authService.loginWithRefresh("test@example.com", "password123")
        );

        assertTrue(ex.getMessage().contains("Cuenta bloqueada temporalmente"));
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    @DisplayName("loginWithRefresh - throws TwoFactorRequiredException when 2FA enabled")
    void loginWithRefresh_2faEnabled_throwsTwoFactorRequired() {
        testUser.setEmailVerified(true);
        testUser.setTotpEnabled(true);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", "encoded-password")).thenReturn(true);
        when(jwtService.generateAccessToken("test@example.com")).thenReturn("temp-token");

        AuthService.TwoFactorRequiredException ex = assertThrows(
                AuthService.TwoFactorRequiredException.class, () ->
                        authService.loginWithRefresh("test@example.com", "password123")
        );

        assertEquals("temp-token", ex.getTempToken());
        verify(jwtService, never()).generateTokenPair(anyString());
    }

    @Test
    @DisplayName("loginWithRefresh - throws when user not found")
    void loginWithRefresh_userNotFound_throws() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                authService.loginWithRefresh("unknown@example.com", "password123")
        );

        assertEquals("Credenciales inválidas", ex.getMessage());
    }

    @Test
    @DisplayName("loginWithRefresh - throws when account uses Google OAuth (no password)")
    void loginWithRefresh_oauthAccount_throws() {
        testUser.setPasswordHash(null);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                authService.loginWithRefresh("test@example.com", "password123")
        );

        assertTrue(ex.getMessage().contains("Google"));
    }

    // ── verifyEmail ─────────────────────────────────────────────────────

    @Test
    @DisplayName("verifyEmail - valid token verifies user email")
    void verifyEmail_validToken_verifiesAndClearsToken() {
        testUser.setVerificationToken("valid-token");
        testUser.setVerificationCode("123456");
        testUser.setVerificationTokenExpiresAt(Instant.now().plusSeconds(3600));
        when(userRepository.findByVerificationToken("valid-token")).thenReturn(Optional.of(testUser));

        boolean result = authService.verifyEmail("valid-token");

        assertTrue(result);

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(userRepository).save(captor.capture());

        UserEntity saved = captor.getValue();
        assertTrue(saved.getEmailVerified());
        assertNull(saved.getVerificationToken());
        assertNull(saved.getVerificationCode());
        assertNull(saved.getVerificationTokenExpiresAt());
    }

    @Test
    @DisplayName("verifyEmail - expired token returns false")
    void verifyEmail_expiredToken_returnsFalse() {
        testUser.setVerificationToken("expired-token");
        testUser.setVerificationTokenExpiresAt(Instant.now().minusSeconds(3600));
        when(userRepository.findByVerificationToken("expired-token")).thenReturn(Optional.of(testUser));

        boolean result = authService.verifyEmail("expired-token");

        assertFalse(result);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("verifyEmail - missing token returns false")
    void verifyEmail_missingToken_returnsFalse() {
        when(userRepository.findByVerificationToken("nonexistent-token")).thenReturn(Optional.empty());

        boolean result = authService.verifyEmail("nonexistent-token");

        assertFalse(result);
        verify(userRepository, never()).save(any());
    }

    // ── verifyEmailByCode ───────────────────────────────────────────────

    @Test
    @DisplayName("verifyEmailByCode - valid code verifies user email")
    void verifyEmailByCode_validCode_verifiesAndClearsToken() {
        testUser.setVerificationCode("123456");
        testUser.setVerificationToken("some-token");
        testUser.setVerificationTokenExpiresAt(Instant.now().plusSeconds(3600));
        testUser.setEmailVerified(false);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        boolean result = authService.verifyEmailByCode("test@example.com", "123456");

        assertTrue(result);

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(userRepository).save(captor.capture());

        UserEntity saved = captor.getValue();
        assertTrue(saved.getEmailVerified());
        assertNull(saved.getVerificationToken());
        assertNull(saved.getVerificationCode());
        assertNull(saved.getVerificationTokenExpiresAt());
    }

    @Test
    @DisplayName("verifyEmailByCode - wrong code returns false")
    void verifyEmailByCode_wrongCode_returnsFalse() {
        testUser.setVerificationCode("123456");
        testUser.setVerificationTokenExpiresAt(Instant.now().plusSeconds(3600));
        testUser.setEmailVerified(false);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        boolean result = authService.verifyEmailByCode("test@example.com", "999999");

        assertFalse(result);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("verifyEmailByCode - expired code returns false")
    void verifyEmailByCode_expiredCode_returnsFalse() {
        testUser.setVerificationCode("123456");
        testUser.setVerificationTokenExpiresAt(Instant.now().minusSeconds(3600));
        testUser.setEmailVerified(false);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        boolean result = authService.verifyEmailByCode("test@example.com", "123456");

        assertFalse(result);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("verifyEmailByCode - already verified returns true without saving")
    void verifyEmailByCode_alreadyVerified_returnsTrueNoSave() {
        testUser.setEmailVerified(true);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        boolean result = authService.verifyEmailByCode("test@example.com", "123456");

        assertTrue(result);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("verifyEmailByCode - null code returns false")
    void verifyEmailByCode_nullCode_returnsFalse() {
        boolean result = authService.verifyEmailByCode("test@example.com", null);

        assertFalse(result);
        verify(userRepository, never()).findByEmail(anyString());
    }

    @Test
    @DisplayName("verifyEmailByCode - empty code returns false")
    void verifyEmailByCode_emptyCode_returnsFalse() {
        boolean result = authService.verifyEmailByCode("test@example.com", "  ");

        assertFalse(result);
        verify(userRepository, never()).findByEmail(anyString());
    }

    @Test
    @DisplayName("verifyEmailByCode - user not found returns false")
    void verifyEmailByCode_userNotFound_returnsFalse() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        boolean result = authService.verifyEmailByCode("unknown@example.com", "123456");

        assertFalse(result);
        verify(userRepository, never()).save(any());
    }

    // ── changePassword ──────────────────────────────────────────────────

    @Test
    @DisplayName("changePassword - successful password change")
    void changePassword_success_encodesAndSavesNewPassword() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("currentPass", "encoded-password")).thenReturn(true);
        when(passwordEncoder.encode("newPassword123")).thenReturn("new-encoded-password");

        authService.changePassword("test@example.com", "currentPass", "newPassword123");

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(userRepository).save(captor.capture());

        assertEquals("new-encoded-password", captor.getValue().getPasswordHash());
    }

    @Test
    @DisplayName("changePassword - wrong current password throws exception")
    void changePassword_wrongCurrentPassword_throws() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPass", "encoded-password")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                authService.changePassword("test@example.com", "wrongPass", "newPassword123")
        );

        assertEquals("Contraseña actual incorrecta", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("changePassword - new password too short throws exception")
    void changePassword_shortNewPassword_throws() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                authService.changePassword("test@example.com", "currentPass", "12345")
        );

        assertEquals("La nueva contraseña debe tener al menos 6 caracteres", ex.getMessage());
        verify(userRepository, never()).findByEmail(anyString());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("changePassword - null new password throws exception")
    void changePassword_nullNewPassword_throws() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                authService.changePassword("test@example.com", "currentPass", null)
        );

        assertEquals("La nueva contraseña debe tener al menos 6 caracteres", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("changePassword - user not found throws exception")
    void changePassword_userNotFound_throws() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                authService.changePassword("unknown@example.com", "currentPass", "newPassword123")
        );

        assertEquals("Usuario no encontrado", ex.getMessage());
        verify(userRepository, never()).save(any());
    }
}
