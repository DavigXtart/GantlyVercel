package com.alvaro.psicoapp.config;

import com.alvaro.psicoapp.security.JwtService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class JwtConfig {

    private static final String DEV_SECRET = "dev-secret-key-32-bytes-minimo-dev-seed";
    private static final long EXPIRATION_MS = 1000L * 60 * 60 * 24; // 24 horas

    @Bean
    public JwtService jwtService(Environment env) {
        String secret = env.getProperty("JWT_SECRET");
        boolean isProd = java.util.Arrays.stream(env.getActiveProfiles()).anyMatch(p -> "prod".equalsIgnoreCase(p));

        if (secret == null || secret.trim().isEmpty()) {
            if (isProd) {
                throw new IllegalStateException("JWT_SECRET debe estar configurado en producción. Define la variable de entorno JWT_SECRET.");
            }
            secret = DEV_SECRET;
        }

        return new JwtService(secret, EXPIRATION_MS);
    }
}
