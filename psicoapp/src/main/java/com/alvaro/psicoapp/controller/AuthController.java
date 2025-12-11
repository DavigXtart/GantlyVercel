package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.dto.AuthDtos;
import com.alvaro.psicoapp.service.AuthService;
import com.alvaro.psicoapp.repository.UserRepository;
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
	public ResponseEntity<AuthDtos.TokenResponse> register(@RequestBody AuthDtos.RegisterRequest req) {
		String token = authService.register(req.name, req.email, req.password, req.sessionId, req.role);
		return ResponseEntity.ok(new AuthDtos.TokenResponse(token));
	}

	@PostMapping("/login")
	public ResponseEntity<AuthDtos.TokenResponse> login(@RequestBody AuthDtos.LoginRequest req) {
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
}