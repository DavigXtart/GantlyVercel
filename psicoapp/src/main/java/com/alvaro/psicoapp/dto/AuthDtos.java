package com.alvaro.psicoapp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class AuthDtos {
	public static class RegisterRequest {
		@NotBlank(message = "El nombre es requerido")
		@Size(min = 2, max = 100)
		public String name;

		@NotBlank(message = "El email es requerido")
		@Email(message = "Email inválido")
		@Size(max = 255)
		public String email;

		@NotBlank(message = "La contraseña es requerida")
		@Size(min = 6, max = 100, message = "La contraseña debe tener entre 6 y 100 caracteres")
		public String password;

		public String sessionId;
		@Size(max = 20)
		public String role;
		public String companyReferralCode;
		public String psychologistReferralCode;

		public LocalDate birthDate;
	}

	public static class LoginRequest {
		@NotBlank(message = "El email es requerido")
		@Email(message = "Email inválido")
		public String email;

		@NotBlank(message = "La contraseña es requerida")
		public String password;
	}
	public static class TokenResponse {
		public String accessToken;
		public String refreshToken;
		public long expiresIn;

		@Deprecated
		public String token;

		public TokenResponse(String accessToken, String refreshToken, long expiresIn) {
			this.accessToken = accessToken;
			this.refreshToken = refreshToken;
			this.expiresIn = expiresIn;

			this.token = accessToken;
		}

		public TokenResponse(String token) {
			this.accessToken = token;
			this.refreshToken = null;
			this.expiresIn = 900;
			this.token = token;
		}
	}

	public static class RefreshTokenRequest {
		@NotBlank(message = "El refresh token es requerido")
		public String refreshToken;
	}

	public static class ForgotPasswordRequest {
		@NotBlank(message = "El email es requerido")
		@Email(message = "Email inválido")
		public String email;
	}

	public static class ResetPasswordRequest {
		@NotBlank(message = "El token es requerido")
		public String token;

		@NotBlank(message = "La nueva contraseña es requerida")
		@Size(min = 6, max = 100, message = "La contraseña debe tener entre 6 y 100 caracteres")
		public String newPassword;
	}

	public static class ChangePasswordRequest {
		@NotBlank(message = "La contraseña actual es requerida")
		public String currentPassword;

		@NotBlank(message = "La nueva contraseña es requerida")
		@Size(min = 6, max = 100, message = "La contraseña debe tener entre 6 y 100 caracteres")
		public String newPassword;
	}

	public record MeResponse(String email, String role, String name, boolean emailVerified) {}

	public record MessageStatusResponse(String message, String status) {}

	public static class CompanyRegisterRequest {
		@NotBlank(message = "El nombre es requerido")
		@Size(min = 2, max = 200)
		public String name;
		@NotBlank(message = "El email es requerido")
		@Email(message = "Email inválido")
		@Size(max = 255)
		public String email;
		@NotBlank(message = "La contraseña es requerida")
		@Size(min = 6, max = 100, message = "La contraseña debe tener entre 6 y 100 caracteres")
		public String password;
	}

	public static class CompanyLoginRequest {
		@NotBlank(message = "El email es requerido")
		@Email(message = "Email inválido")
		public String email;
		@NotBlank(message = "La contraseña es requerida")
		public String password;
	}
}
