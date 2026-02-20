package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.dto.AuthDtos;
import com.alvaro.psicoapp.service.AuthService;
import com.alvaro.psicoapp.service.CompanyAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticación", description = "APIs para registro, login, verificación de email y gestión de contraseñas")
public class AuthController {
	private static final String COMPANY_PREFIX = "company:";

	private final AuthService authService;
	private final CompanyAuthService companyAuthService;

	public AuthController(AuthService authService, CompanyAuthService companyAuthService) {
		this.authService = authService;
		this.companyAuthService = companyAuthService;
	}

	@PostMapping("/register")
	@Operation(summary = "Registrar nuevo usuario", description = "Crea una nueva cuenta de usuario. Soporta registro con código de referencia de empresa o psicólogo.")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Usuario registrado exitosamente", 
			content = @Content(schema = @Schema(implementation = AuthDtos.TokenResponse.class))),
		@ApiResponse(responseCode = "400", description = "Datos de registro inválidos")
	})
	public ResponseEntity<AuthDtos.TokenResponse> register(@Valid @RequestBody AuthDtos.RegisterRequest req) {
		var tokenPair = authService.registerWithRefresh(req.name, req.email, req.password, req.sessionId, req.role,
				req.companyReferralCode, req.psychologistReferralCode, req.birthDate);
		return ResponseEntity.ok(new AuthDtos.TokenResponse(tokenPair.accessToken, tokenPair.refreshToken, 900));
	}

	@PostMapping("/login")
	@Operation(summary = "Iniciar sesión", description = "Autentica un usuario con email y contraseña, retorna access token y refresh token")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Login exitoso", 
			content = @Content(schema = @Schema(implementation = AuthDtos.TokenResponse.class))),
		@ApiResponse(responseCode = "401", description = "Credenciales inválidas")
	})
	public ResponseEntity<AuthDtos.TokenResponse> login(@Valid @RequestBody AuthDtos.LoginRequest req) {
		var tokenPair = authService.loginWithRefresh(req.email, req.password);
		return ResponseEntity.ok(new AuthDtos.TokenResponse(tokenPair.accessToken, tokenPair.refreshToken, 900));
	}
	
	@PostMapping("/refresh")
	@Operation(summary = "Refrescar access token", description = "Genera un nuevo access token usando un refresh token válido")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Token refrescado exitosamente"),
		@ApiResponse(responseCode = "401", description = "Refresh token inválido o expirado")
	})
	public ResponseEntity<AuthDtos.TokenResponse> refreshToken(@Valid @RequestBody AuthDtos.RefreshTokenRequest req) {
		String newAccessToken = authService.refreshAccessToken(req.refreshToken);
		return ResponseEntity.ok(new AuthDtos.TokenResponse(newAccessToken, req.refreshToken, 900));
	}

	@PostMapping("/company/register")
	@Operation(summary = "Registrar nueva empresa", description = "Crea una nueva cuenta de empresa")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Empresa registrada exitosamente", 
			content = @Content(schema = @Schema(implementation = AuthDtos.TokenResponse.class))),
		@ApiResponse(responseCode = "400", description = "Datos de registro inválidos")
	})
	public ResponseEntity<AuthDtos.TokenResponse> registerCompany(@Valid @RequestBody AuthDtos.CompanyRegisterRequest req) {
		var tokenPair = companyAuthService.registerWithRefresh(req.name, req.email, req.password);
		return ResponseEntity.ok(new AuthDtos.TokenResponse(tokenPair.accessToken, tokenPair.refreshToken, 900));
	}

	@PostMapping("/company/login")
	@Operation(summary = "Iniciar sesión como empresa", description = "Autentica una empresa con email y contraseña")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Login exitoso", 
			content = @Content(schema = @Schema(implementation = AuthDtos.TokenResponse.class))),
		@ApiResponse(responseCode = "401", description = "Credenciales inválidas")
	})
	public ResponseEntity<AuthDtos.TokenResponse> loginCompany(@Valid @RequestBody AuthDtos.CompanyLoginRequest req) {
		var tokenPair = companyAuthService.loginWithRefresh(req.email, req.password);
		return ResponseEntity.ok(new AuthDtos.TokenResponse(tokenPair.accessToken, tokenPair.refreshToken, 900));
	}

    @GetMapping("/me")
    @Operation(summary = "Obtener información del usuario autenticado", description = "Retorna la información del usuario o empresa autenticada")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Información del usuario", 
			content = @Content(schema = @Schema(implementation = AuthDtos.MeResponse.class))),
		@ApiResponse(responseCode = "401", description = "No autenticado")
	})
    public ResponseEntity<AuthDtos.MeResponse> me(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        String subject = principal.getName();
        if (subject != null && subject.startsWith(COMPANY_PREFIX)) {
            String email = subject.substring(COMPANY_PREFIX.length());
            var companyMe = companyAuthService.getMe(email);
            if (companyMe != null) {
                return ResponseEntity.ok(new AuthDtos.MeResponse(companyMe.email(), "EMPRESA", companyMe.name(), true));
            }
        } else {
            AuthDtos.MeResponse me = authService.getMe(subject);
            if (me != null) return ResponseEntity.ok(me);
        }
        return ResponseEntity.status(401).build();
    }

    @GetMapping("/verify-email")
    @Operation(summary = "Verificar email", description = "Verifica el email del usuario usando el token enviado por correo")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Email verificado o token inválido", 
			content = @Content(schema = @Schema(implementation = AuthDtos.MessageStatusResponse.class)))
	})
    public ResponseEntity<AuthDtos.MessageStatusResponse> verifyEmail(@RequestParam("token") String token) {
        boolean verified = authService.verifyEmail(token);
        return ResponseEntity.ok(verified
                ? new AuthDtos.MessageStatusResponse("Email verificado exitosamente", "success")
                : new AuthDtos.MessageStatusResponse("Token de verificación inválido o expirado", "error"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Solicitar recuperación de contraseña", description = "Envía un email con enlace para restablecer la contraseña")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Si el email existe, se enviará un enlace de recuperación", 
			content = @Content(schema = @Schema(implementation = AuthDtos.MessageStatusResponse.class)))
	})
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
    @Operation(summary = "Restablecer contraseña", description = "Restablece la contraseña usando el token recibido por email")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Contraseña restablecida exitosamente", 
			content = @Content(schema = @Schema(implementation = AuthDtos.MessageStatusResponse.class))),
		@ApiResponse(responseCode = "400", description = "Token inválido o expirado")
	})
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
    @Operation(summary = "Cambiar contraseña", description = "Cambia la contraseña del usuario autenticado")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Contraseña cambiada exitosamente", 
			content = @Content(schema = @Schema(implementation = AuthDtos.MessageStatusResponse.class))),
		@ApiResponse(responseCode = "400", description = "Contraseña actual incorrecta o datos inválidos"),
		@ApiResponse(responseCode = "401", description = "No autenticado")
	})
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
    @Operation(summary = "Reenviar email de verificación", description = "Reenvía el email de verificación al usuario autenticado")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Email de verificación reenviado", 
			content = @Content(schema = @Schema(implementation = AuthDtos.MessageStatusResponse.class))),
		@ApiResponse(responseCode = "400", description = "Error al reenviar el email"),
		@ApiResponse(responseCode = "401", description = "No autenticado")
	})
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