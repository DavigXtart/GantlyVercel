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
		String token = authService.register(req.name, req.email, req.password, req.sessionId);
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
            });
        }
        return ResponseEntity.ok(response);
    }
}