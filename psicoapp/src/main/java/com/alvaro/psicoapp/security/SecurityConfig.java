package com.alvaro.psicoapp.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import com.alvaro.psicoapp.security.filter.JwtAuthFilter;
import com.alvaro.psicoapp.security.filter.MaintenanceFilter;
import com.alvaro.psicoapp.security.filter.RateLimitFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

	@Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:4200}")
	private String allowedOrigins;

	@Autowired(required = false)
	private ClientRegistrationRepository clientRegistrationRepository;

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter, RateLimitFilter rateLimitFilter, MaintenanceFilter maintenanceFilter,
			OAuth2SuccessHandler oauth2SuccessHandler, Environment env) throws Exception {
        boolean isProd = java.util.Arrays.stream(env.getActiveProfiles()).anyMatch(p -> "prod".equalsIgnoreCase(p));

		http
            .cors(Customizer.withDefaults())
			.csrf(csrf -> csrf.disable())
			.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.addFilterBefore(maintenanceFilter, UsernamePasswordAuthenticationFilter.class)
			.addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class);
		if (clientRegistrationRepository != null) {
			http.oauth2Login(oauth2 -> oauth2.successHandler(oauth2SuccessHandler));
		}
		http
            .requiresChannel(channel -> {
                if (isProd) channel.anyRequest().requiresSecure();
            })
            .headers(headers -> {
                headers.contentTypeOptions(Customizer.withDefaults());
                headers.frameOptions(frame -> frame.deny());
                headers.referrerPolicy(referrer -> referrer.policy(
                    org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN));
                headers.permissionsPolicy(pp -> pp.policy(
                    "camera=(self), microphone=(self), geolocation=(), payment=(self)"));
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
				.requestMatchers("/api/tests/**").permitAll()
				.requestMatchers("/api/initial-test/**").permitAll()
				.requestMatchers("/api/matching/**").authenticated()
				.requestMatchers("/api/flow/**").authenticated()
				.requestMatchers("/api/profile/**").authenticated()
				.requestMatchers("/api/tasks/**").authenticated()
				.requestMatchers("/uploads/**").permitAll()
				.requestMatchers("/api/assigned-tests/**").authenticated()
				.requestMatchers("/api/calendar/**").authenticated()
				.requestMatchers("/api/psych/**").authenticated()
				.requestMatchers("/api/chat/**").authenticated()
				.requestMatchers("/api/notifications/**").authenticated()
				.requestMatchers("/api/consent/**").authenticated()
				.requestMatchers("/api/results/**").authenticated()
				.requestMatchers("/api/jitsi/**").authenticated()
				.requestMatchers("/api/stripe/webhook").permitAll()
				.requestMatchers("/api/stripe/**").authenticated()
				.requestMatchers("/ws/**", "/topic/**", "/app/**").permitAll()
				.requestMatchers("/actuator/health").permitAll()
				.requestMatchers("/actuator/**").authenticated()
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
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        origins.forEach(origin -> config.addAllowedOrigin(origin.trim()));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
