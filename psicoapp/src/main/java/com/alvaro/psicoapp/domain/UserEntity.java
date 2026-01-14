package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;
import java.time.Instant;

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

	@Column(name = "password_hash", nullable = false, length = 255)
	private String passwordHash;

	@Column(length = 20)
	private String gender;

	private Integer age;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	@Column(length = 20)
	private String role = "USER"; // USER o ADMIN

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
}