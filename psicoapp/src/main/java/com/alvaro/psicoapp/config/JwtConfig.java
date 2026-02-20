package com.alvaro.psicoapp.config;

import com.alvaro.psicoapp.security.JwtService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

/**
 * Configuración mejorada de JWT con access tokens (15 min) y refresh tokens (7 días).
 * Cumple con estándares de seguridad para aplicaciones médicas/psicológicas.
 */
@Configuration
public class JwtConfig {

    // Secret de desarrollo: mínimo 32 bytes (256 bits) para AES-256
    private static final String DEV_SECRET = "dev-secret-key-32-bytes-minimo-dev-seed-256bit";
    
    // Access token: 15 minutos (tokens de corta duración para mayor seguridad)
    private static final long ACCESS_TOKEN_EXPIRATION_MS = 1000L * 60 * 15;
    
    // Refresh token: 7 días (permite renovar sin re-login frecuente)
    private static final long REFRESH_TOKEN_EXPIRATION_MS = 1000L * 60 * 60 * 24 * 7;

    @Bean
    public JwtService jwtService(Environment env) {
        String secret = env.getProperty("JWT_SECRET");
        boolean isProd = java.util.Arrays.stream(env.getActiveProfiles()).anyMatch(p -> "prod".equalsIgnoreCase(p));

        if (secret == null || secret.trim().isEmpty()) {
            if (isProd) {
                throw new IllegalStateException(
                    "JWT_SECRET debe estar configurado en producción con al menos 32 bytes (256 bits). " +
                    "Define la variable de entorno JWT_SECRET con un valor seguro generado aleatoriamente."
                );
            }
            secret = DEV_SECRET;
        }

        // Validar longitud mínima del secret
        if (secret.getBytes().length < 32) {
            throw new IllegalStateException(
                "JWT_SECRET debe tener al menos 32 bytes (256 bits) para seguridad AES-256. " +
                "Longitud actual: " + secret.getBytes().length + " bytes"
            );
        }

        return new JwtService(secret, ACCESS_TOKEN_EXPIRATION_MS, REFRESH_TOKEN_EXPIRATION_MS);
    }
}
