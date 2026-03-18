package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.CompanyEntity;
import com.alvaro.psicoapp.repository.CompanyRepository;
import com.alvaro.psicoapp.security.JwtService;
import com.alvaro.psicoapp.util.InputSanitizer;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class CompanyAuthService {
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    private static final String COMPANY_PREFIX = "company:";

    public CompanyAuthService(CompanyRepository companyRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.companyRepository = companyRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public com.alvaro.psicoapp.security.JwtService.TokenPair registerWithRefresh(String name, String email, String password) {
        String sanitizedEmail = InputSanitizer.sanitizeEmail(email);
        String sanitizedName = InputSanitizer.sanitizeAndValidate(name != null ? name : "", 200);
        if (sanitizedName.isEmpty()) throw new IllegalArgumentException("El nombre es requerido");

        if (companyRepository.existsByEmail(sanitizedEmail)) {
            throw new IllegalArgumentException("Este email ya está registrado como empresa");
        }

        CompanyEntity c = new CompanyEntity();
        c.setName(sanitizedName);
        c.setEmail(sanitizedEmail);
        c.setPasswordHash(passwordEncoder.encode(password));
        c.setReferralCode(generateReferralCode());
        companyRepository.save(c);

        return jwtService.generateTokenPair(COMPANY_PREFIX + c.getEmail());
    }

    public com.alvaro.psicoapp.security.JwtService.TokenPair loginWithRefresh(String email, String password) {
        String sanitizedEmail = InputSanitizer.sanitizeEmail(email);
        CompanyEntity c = companyRepository.findByEmail(sanitizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Credenciales inválidas"));
        if (!passwordEncoder.matches(password, c.getPasswordHash())) {
            throw new IllegalArgumentException("Credenciales inválidas");
        }
        return jwtService.generateTokenPair(COMPANY_PREFIX + c.getEmail());
    }

    public CompanyMeResponse getMe(String email) {
        return companyRepository.findByEmail(email)
                .map(c -> new CompanyMeResponse(c.getEmail(), c.getName(), c.getReferralCode()))
                .orElse(null);
    }

    private String generateReferralCode() {
        String code;
        do {
            code = "EMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase().replace("-", "");
        } while (companyRepository.existsByReferralCode(code));
        return code;
    }

    public record CompanyMeResponse(String email, String name, String referralCode) {}
}
