package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "users")
public class UserEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 100)
	private String name;

	@Column(nullable = false, unique = true, length = 255)
	private String email;

	@Column(name = "password_hash", length = 255)
	private String passwordHash;

	@Column(name = "oauth2_provider", length = 50)
	private String oauth2Provider;

	@Column(name = "oauth2_provider_id", length = 255)
	private String oauth2ProviderId;

	@Column(length = 20)
	private String gender;

	private Integer age;

	@Column(name = "birth_date")
	private LocalDate birthDate;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	@Column(length = 20)
	private String role = "USER";

	@Column(name = "avatar_url", length = 500)
	private String avatarUrl;

	@Column(name = "dark_mode")
	private Boolean darkMode = false;

	@Column(name = "email_verified")
	private Boolean emailVerified = false;

	@Column(name = "verification_token", length = 255)
	private String verificationToken;

	@Column(name = "verification_token_expires_at")
	private Instant verificationTokenExpiresAt;

	@Column(name = "password_reset_token", length = 255)
	private String passwordResetToken;

	@Column(name = "password_reset_token_expires_at")
	private Instant passwordResetTokenExpiresAt;

	@Column(name = "is_full")
	private Boolean isFull = false;

	@Column(name = "company_id")
	private Long companyId;

	@Column(name = "referral_code", unique = true, length = 100)
	private String referralCode;

	@Column(name = "failed_login_attempts", nullable = false)
	private Integer failedLoginAttempts = 0;

	@Column(name = "account_locked_until")
	private Instant accountLockedUntil;

	@Column(name = "totp_secret", length = 255)
	private String totpSecret;

	@Column(name = "totp_enabled", nullable = false)
	private Boolean totpEnabled = false;

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public String getName() { return name; }
	public void setName(String name) { this.name = name; }
	public String getEmail() { return email; }
	public void setEmail(String email) { this.email = email; }
	public String getPasswordHash() { return passwordHash; }
	public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
	public String getGender() { return gender; }
	public void setGender(String gender) { this.gender = gender; }
	public Integer getAge() { return age; }
	public void setAge(Integer age) { this.age = age; }
	public LocalDate getBirthDate() { return birthDate; }
	public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }
	public Instant getCreatedAt() { return createdAt; }
	public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
	public String getRole() { return role; }
	public void setRole(String role) { this.role = role; }
	public String getAvatarUrl() { return avatarUrl; }
	public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
	public Boolean getDarkMode() { return darkMode; }
	public void setDarkMode(Boolean darkMode) { this.darkMode = darkMode; }
	public Boolean getEmailVerified() { return emailVerified; }
	public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }
	public String getVerificationToken() { return verificationToken; }
	public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }
	public Instant getVerificationTokenExpiresAt() { return verificationTokenExpiresAt; }
	public void setVerificationTokenExpiresAt(Instant verificationTokenExpiresAt) { this.verificationTokenExpiresAt = verificationTokenExpiresAt; }
	public String getPasswordResetToken() { return passwordResetToken; }
	public void setPasswordResetToken(String passwordResetToken) { this.passwordResetToken = passwordResetToken; }
	public Instant getPasswordResetTokenExpiresAt() { return passwordResetTokenExpiresAt; }
	public void setPasswordResetTokenExpiresAt(Instant passwordResetTokenExpiresAt) { this.passwordResetTokenExpiresAt = passwordResetTokenExpiresAt; }
	public Boolean getIsFull() { return isFull; }
	public void setIsFull(Boolean isFull) { this.isFull = isFull; }
	public String getOauth2Provider() { return oauth2Provider; }
	public void setOauth2Provider(String oauth2Provider) { this.oauth2Provider = oauth2Provider; }
	public String getOauth2ProviderId() { return oauth2ProviderId; }
	public void setOauth2ProviderId(String oauth2ProviderId) { this.oauth2ProviderId = oauth2ProviderId; }
	public Long getCompanyId() { return companyId; }
	public void setCompanyId(Long companyId) { this.companyId = companyId; }
	public String getReferralCode() { return referralCode; }
	public void setReferralCode(String referralCode) { this.referralCode = referralCode; }
	public Integer getFailedLoginAttempts() { return failedLoginAttempts; }
	public void setFailedLoginAttempts(Integer failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; }
	public Instant getAccountLockedUntil() { return accountLockedUntil; }
	public void setAccountLockedUntil(Instant accountLockedUntil) { this.accountLockedUntil = accountLockedUntil; }
	public String getTotpSecret() { return totpSecret; }
	public void setTotpSecret(String totpSecret) { this.totpSecret = totpSecret; }
	public Boolean getTotpEnabled() { return totpEnabled; }
	public void setTotpEnabled(Boolean totpEnabled) { this.totpEnabled = totpEnabled; }
}
