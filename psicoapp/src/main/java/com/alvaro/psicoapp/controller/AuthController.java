package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.dto.AuthDtos;
import com.alvaro.psicoapp.service.AuthService;
import com.alvaro.psicoapp.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
	private final AuthService authService;
	private final UserRepository userRepository;
	public AuthController(AuthService authService, UserRepository userRepository) { 
		this.authService = authService;
		this.userRepository = userRepository;
	}

	@PostMapping("/register")
	public ResponseEntity<AuthDtos.TokenResponse> register(@Valid @RequestBody AuthDtos.RegisterRequest req) {
		String token = authService.register(req.name, req.email, req.password, req.sessionId, req.role);
		return ResponseEntity.ok(new AuthDtos.TokenResponse(token));
	}

	@PostMapping("/login")
	public ResponseEntity<AuthDtos.TokenResponse> login(@Valid @RequestBody AuthDtos.LoginRequest req) {
		String token = authService.login(req.email, req.password);
		return ResponseEntity.ok(new AuthDtos.TokenResponse(token));
	}

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(Principal principal) {
        Map<String, Object> response = new HashMap<>();
        if (principal != null) {
            String email = principal.getName();
            userRepository.findByEmail(email).ifPresent(user -> {
                response.put("email", email);
                response.put("role", user.getRole());
                response.put("name", user.getName());
                response.put("emailVerified", user.getEmailVerified());
            });
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestParam("token") String token) {
        boolean verified = authService.verifyEmail(token);
        Map<String, String> response = new HashMap<>();
        if (verified) {
            response.put("message", "Email verificado exitosamente");
            response.put("status", "success");
        } else {
            response.put("message", "Token de verificación inválido o expirado");
            response.put("status", "error");
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody AuthDtos.ForgotPasswordRequest req) {
        try {
            authService.requestPasswordReset(req.email);
            // Siempre devolver éxito para evitar que usuarios descubran emails válidos
            return ResponseEntity.ok(Map.of("message", "Si el email existe, se enviará un enlace de recuperación", "status", "success"));
        } catch (Exception e) {
            // Siempre devolver éxito para evitar que usuarios descubran emails válidos
            return ResponseEntity.ok(Map.of("message", "Si el email existe, se enviará un enlace de recuperación", "status", "success"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody AuthDtos.ResetPasswordRequest req) {
        try {
            boolean success = authService.resetPassword(req.token, req.newPassword);
            if (success) {
                return ResponseEntity.ok(Map.of("message", "Contraseña restablecida exitosamente", "status", "success"));
            } else {
                return ResponseEntity.badRequest().body(Map.of("message", "Token inválido o expirado", "status", "error"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error al restablecer la contraseña: " + e.getMessage(), "status", "error"));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(Principal principal, @Valid @RequestBody AuthDtos.ChangePasswordRequest req) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("message", "No autorizado", "status", "error"));
            }
            authService.changePassword(principal.getName(), req.currentPassword, req.newPassword);
            return ResponseEntity.ok(Map.of("message", "Contraseña cambiada exitosamente", "status", "success"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage(), "status", "error"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error al cambiar la contraseña: " + e.getMessage(), "status", "error"));
        }
    }

    @PostMapping("/resend-verification-email")
    public ResponseEntity<Map<String, String>> resendVerificationEmail(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("message", "No autorizado", "status", "error"));
            }
            authService.resendVerificationEmail(principal.getName());
            return ResponseEntity.ok(Map.of("message", "Email de verificación reenviado exitosamente", "status", "success"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage(), "status", "error"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error al reenviar el email de verificación: " + e.getMessage(), "status", "error"));
        }
    }
}