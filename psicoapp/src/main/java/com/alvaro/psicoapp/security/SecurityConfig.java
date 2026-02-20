package com.alvaro.psicoapp.security;

import org.springframework.core.env.Environment;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import com.alvaro.psicoapp.security.filter.JwtAuthFilter;
import com.alvaro.psicoapp.security.filter.RateLimitFilter;

@Configuration
public class SecurityConfig {
	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter, RateLimitFilter rateLimitFilter,
			OAuth2SuccessHandler oauth2SuccessHandler, Environment env) throws Exception {
        boolean isProd = java.util.Arrays.stream(env.getActiveProfiles()).anyMatch(p -> "prod".equalsIgnoreCase(p));

		http
            .cors(Customizer.withDefaults())
			.csrf(csrf -> csrf.disable())
			.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
			.oauth2Login(oauth2 -> oauth2.successHandler(oauth2SuccessHandler))
            .requiresChannel(channel -> {
                if (isProd) channel.anyRequest().requiresSecure();
            })
            .headers(headers -> {
                if (isProd) {
                    headers.httpStrictTransportSecurity(hsts -> hsts
                        .includeSubDomains(true)
                        .preload(true)
                        .maxAgeInSeconds(31536000)
                    );
                }
            })
			.authorizeHttpRequests(auth -> auth
				.requestMatchers("/api/auth/**").permitAll()
				.requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
				.requestMatchers("/api/auth/verify-email").permitAll()
				.requestMatchers("/api/tests/**").permitAll() // Tests visibles para todos
				.requestMatchers("/api/initial-test/**").permitAll() // Test inicial público
				.requestMatchers("/api/matching/**").authenticated() // Tests de matching requieren autenticación
				.requestMatchers("/api/flow/**").authenticated() // Flujo de respuestas requiere autenticación
				.requestMatchers("/api/profile/**").authenticated()
				.requestMatchers("/api/tasks/**").authenticated()
				.requestMatchers("/uploads/**").permitAll() // Permitir acceso a archivos subidos
				.requestMatchers("/api/assigned-tests/**").authenticated() // Tests asignados requieren autenticación
				.requestMatchers("/api/calendar/**").authenticated()
				.requestMatchers("/api/psych/**").authenticated()
				.requestMatchers("/api/chat/**").authenticated()
				.requestMatchers("/api/consent/**").authenticated()
				.requestMatchers("/api/results/**").authenticated()
				.requestMatchers("/api/jitsi/**").authenticated()
				.requestMatchers("/api/stripe/webhook").permitAll() // Webhook debe ser público
				.requestMatchers("/api/stripe/**").authenticated() // Otros endpoints de Stripe requieren autenticación
				.requestMatchers("/ws/**", "/topic/**", "/app/**").permitAll()
				.requestMatchers("/actuator/**").permitAll()
				.requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**", "/swagger-ui.html", "/webjars/**").permitAll()
				.requestMatchers("/api/admin/**").access((authentication, context) -> {
                    var authn = authentication.get();
                    boolean isAdmin = authn != null && authn.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                    return new AuthorizationDecision(isAdmin);
                })
				.requestMatchers("/api/company/**").access((authentication, context) -> {
                    var authn = authentication.get();
                    boolean isCompany = authn != null && authn.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_EMPRESA"));
                    return new AuthorizationDecision(isCompany);
                })
                .requestMatchers("/error", "/favicon.ico").permitAll()
                .anyRequest().authenticated()
            )
			.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
		return http.build();
	}

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOriginPattern("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        config.setAllowCredentials(true);
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}