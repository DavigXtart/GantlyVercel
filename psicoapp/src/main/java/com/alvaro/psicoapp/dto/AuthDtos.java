package com.alvaro.psicoapp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

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

		public String sessionId; // ID de sesión temporal después de completar test inicial
		@Size(max = 20)
		public String role; // USER o PSYCHOLOGIST
	}

	public static class LoginRequest {
		@NotBlank(message = "El email es requerido")
		@Email(message = "Email inválido")
		public String email;

		@NotBlank(message = "La contraseña es requerida")
		public String password;
	}
	public static class TokenResponse {
		public String token;
		public TokenResponse(String token){ this.token = token; }
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
}