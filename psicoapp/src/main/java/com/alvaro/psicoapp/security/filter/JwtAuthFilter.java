package com.alvaro.psicoapp.security.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.repository.CompanyRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.security.JwtService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);
    private static final String COMPANY_PREFIX = "company:";

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;

    public JwtAuthFilter(JwtService jwtService, UserRepository userRepository, CompanyRepository companyRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
    }

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		String header = request.getHeader("Authorization");

		if (header != null && header.startsWith("Bearer ")) {
			String token = header.substring(7);
            try {
                String subject = jwtService.parseSubject(token);

                if (subject == null || subject.trim().isEmpty()) {
                    logger.debug("Token sin subject válido");
                    filterChain.doFilter(request, response);
                    return;
                }

                String role;
                if (subject.startsWith(COMPANY_PREFIX)) {
                    String companyEmail = subject.substring(COMPANY_PREFIX.length());
                    role = companyRepository.findByEmail(companyEmail)
                        .map(c -> RoleConstants.EMPRESA)
                        .orElse(RoleConstants.USER);
                } else {
                    role = userRepository.findByEmail(subject)
                        .map(u -> u.getRole())
                        .orElse(RoleConstants.USER);
                }

                var auth = new UsernamePasswordAuthenticationToken(
                    subject,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + role))
                );
                SecurityContextHolder.getContext().setAuthentication(auth);

            } catch (SecurityException e) {

                logger.debug("Token inválido o expirado: {}", e.getMessage());

            } catch (Exception e) {

                logger.warn("Error procesando token JWT: {}", e.getMessage());
            }
		}

		filterChain.doFilter(request, response);
	}
}
