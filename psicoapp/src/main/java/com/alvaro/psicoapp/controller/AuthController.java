package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.dto.AuthDtos;
import com.alvaro.psicoapp.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
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
    public ResponseEntity<AuthDtos.MeResponse> me(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        AuthDtos.MeResponse me = authService.getMe(principal.getName());
        return me != null ? ResponseEntity.ok(me) : ResponseEntity.status(401).build();
    }

    @GetMapping("/verify-email")
    public ResponseEntity<AuthDtos.MessageStatusResponse> verifyEmail(@RequestParam("token") String token) {
        boolean verified = authService.verifyEmail(token);
        return ResponseEntity.ok(verified
                ? new AuthDtos.MessageStatusResponse("Email verificado exitosamente", "success")
                : new AuthDtos.MessageStatusResponse("Token de verificación inválido o expirado", "error"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<AuthDtos.MessageStatusResponse> forgotPassword(@Valid @RequestBody AuthDtos.ForgotPasswordRequest req) {
        try {
            authService.requestPasswordReset(req.email);
            // Siempre devolver éxito para evitar que usuarios descubran emails válidos
            return ResponseEntity.ok(new AuthDtos.MessageStatusResponse("Si el email existe, se enviará un enlace de recuperación", "success"));
        } catch (Exception e) {
            // Siempre devolver éxito para evitar que usuarios descubran emails válidos
            return ResponseEntity.ok(new AuthDtos.MessageStatusResponse("Si el email existe, se enviará un enlace de recuperación", "success"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<AuthDtos.MessageStatusResponse> resetPassword(@Valid @RequestBody AuthDtos.ResetPasswordRequest req) {
        try {
            boolean success = authService.resetPassword(req.token, req.newPassword);
            if (success) {
                return ResponseEntity.ok(new AuthDtos.MessageStatusResponse("Contraseña restablecida exitosamente", "success"));
            } else {
                return ResponseEntity.badRequest().body(new AuthDtos.MessageStatusResponse("Token inválido o expirado", "error"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthDtos.MessageStatusResponse("Error al restablecer la contraseña: " + e.getMessage(), "error"));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<AuthDtos.MessageStatusResponse> changePassword(Principal principal, @Valid @RequestBody AuthDtos.ChangePasswordRequest req) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(new AuthDtos.MessageStatusResponse("No autorizado", "error"));
            }
            authService.changePassword(principal.getName(), req.currentPassword, req.newPassword);
            return ResponseEntity.ok(new AuthDtos.MessageStatusResponse("Contraseña cambiada exitosamente", "success"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new AuthDtos.MessageStatusResponse(e.getMessage(), "error"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthDtos.MessageStatusResponse("Error al cambiar la contraseña: " + e.getMessage(), "error"));
        }
    }

    @PostMapping("/resend-verification-email")
    public ResponseEntity<AuthDtos.MessageStatusResponse> resendVerificationEmail(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(new AuthDtos.MessageStatusResponse("No autorizado", "error"));
            }
            authService.resendVerificationEmail(principal.getName());
            return ResponseEntity.ok(new AuthDtos.MessageStatusResponse("Email de verificación reenviado exitosamente", "success"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new AuthDtos.MessageStatusResponse(e.getMessage(), "error"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthDtos.MessageStatusResponse("Error al reenviar el email de verificación: " + e.getMessage(), "error"));
        }
    }
}