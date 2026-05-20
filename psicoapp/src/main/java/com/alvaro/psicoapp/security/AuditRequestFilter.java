package com.alvaro.psicoapp.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.alvaro.psicoapp.repository.UserRepository;

import java.io.IOException;
import java.util.Set;

/**
 * RGPD-6: Audit filter that logs access to sensitive API endpoints.
 * Logs method, path, userId (resolved from email principal), and response status.
 * Runs AFTER JwtAuthFilter so SecurityContext is populated.
 */
@Component
public class AuditRequestFilter extends OncePerRequestFilter {

    private static final Logger audit = LoggerFactory.getLogger("AUDIT");

    private static final Set<String> AUDITED_PREFIXES = Set.of(
        "/api/user/",
        "/api/chat/",
        "/api/calendar/",
        "/api/clinic/",
        "/api/admin/"
    );

    private static final String COMPANY_PREFIX = "company:";

    private final UserRepository userRepository;

    public AuditRequestFilter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        // Let the request proceed first, then log after response is committed
        filterChain.doFilter(request, response);

        // Log after the response — no impact on request latency
        String path = request.getRequestURI();
        if (shouldAudit(path)) {
            String method = request.getMethod();
            String userId = resolveUserId();
            int status = response.getStatus();
            audit.info("AUDIT: method={} path={} userId={} status={}", method, path, userId, status);
        }
    }

    private boolean shouldAudit(String path) {
        for (String prefix : AUDITED_PREFIXES) {
            if (path.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Resolve the userId from SecurityContext.
     * The principal is the user email (or "company:email" for clinic accounts).
     * We look up the numeric ID to avoid logging PII (email) in audit logs.
     */
    private String resolveUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null || "anonymousUser".equals(auth.getPrincipal())) {
            return "anonymous";
        }

        String principal = auth.getPrincipal().toString();

        if (principal.startsWith(COMPANY_PREFIX)) {
            // Clinic account — log as "company:<email-hash>" to avoid PII
            return "company";
        }

        try {
            return userRepository.findByEmail(principal)
                    .map(user -> String.valueOf(user.getId()))
                    .orElse("unknown");
        } catch (Exception e) {
            return "error";
        }
    }
}
