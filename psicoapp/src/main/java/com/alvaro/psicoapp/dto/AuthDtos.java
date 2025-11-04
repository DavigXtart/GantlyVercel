package com.alvaro.psicoapp.dto;

public class AuthDtos {
	public static class RegisterRequest {
		public String name;
		public String email;
		public String password;
		public String sessionId; // ID de sesión temporal después de completar test inicial
	}
	public static class LoginRequest {
		public String email;
		public String password;
	}
	public static class TokenResponse {
		public String token;
		public TokenResponse(String token){ this.token = token; }
	}
}