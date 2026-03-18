package com.alvaro.psicoapp.security.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(RateLimitFilter.class);

    private static final int MAX_REQUESTS_PER_MINUTE = 60;
    private static final int MAX_REQUESTS_PER_MINUTE_AUTH = 30;
    private static final int MAX_REQUESTS_PER_MINUTE_SENSITIVE = 5;
    private static final int MAX_REQUESTS_PER_MINUTE_GLOBAL = 300;
    private static final long TIME_WINDOW_MS = 60_000;

    private final Map<String, RequestCounter> requestCounters = new ConcurrentHashMap<>();
    private final Map<String, RequestCounter> globalIpCounters = new ConcurrentHashMap<>();

    private final AtomicLong lastCleanup = new AtomicLong(System.currentTimeMillis());
    private static final long CLEANUP_INTERVAL_MS = 300_000;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {

        cleanupOldCounters();

        String ipAddress = getClientIpAddress(request);
        String endpoint = request.getRequestURI();
        String key = ipAddress + ":" + endpoint;

        boolean isSensitiveEndpoint = endpoint.contains("/verify-code") || endpoint.contains("/reset-password")
                || endpoint.contains("/login") || endpoint.contains("/register");
        boolean isAuthEndpoint = endpoint.startsWith("/api/auth/");
        int maxRequests = isSensitiveEndpoint ? MAX_REQUESTS_PER_MINUTE_SENSITIVE
                : isAuthEndpoint ? MAX_REQUESTS_PER_MINUTE_AUTH : MAX_REQUESTS_PER_MINUTE;

        // Global per-IP rate limit (across all endpoints)
        RequestCounter globalCounter = globalIpCounters.computeIfAbsent(ipAddress, k -> new RequestCounter());
        long now = System.currentTimeMillis();
        if (now - globalCounter.getFirstRequestTime() > TIME_WINDOW_MS) {
            globalCounter.reset(now);
        }
        int globalCount = globalCounter.incrementAndGet();
        if (globalCount > MAX_REQUESTS_PER_MINUTE_GLOBAL) {
            logger.warn("Global rate limit excedido para IP: {} ({} requests)", ipAddress, globalCount);
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Demasiadas peticiones. Por favor intenta mas tarde.\"}");
            return;
        }

        // Per-endpoint rate limit
        RequestCounter counter = requestCounters.computeIfAbsent(key, k -> new RequestCounter());
        if (now - counter.getFirstRequestTime() > TIME_WINDOW_MS) {
            counter.reset(now);
        }
        int currentCount = counter.incrementAndGet();

        if (currentCount > maxRequests) {
            logger.warn("Rate limit excedido para IP: {} en endpoint: {} ({} requests)",
                       ipAddress, endpoint, currentCount);
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Demasiadas peticiones. Por favor intenta mas tarde.\"}");
            return;
        }

        response.setHeader("X-RateLimit-Limit", String.valueOf(maxRequests));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, maxRequests - currentCount)));

        filterChain.doFilter(request, response);
    }

    private static final java.util.Set<String> TRUSTED_PROXIES = java.util.Set.of(
        "127.0.0.1", "::1", "0:0:0:0:0:0:0:1"
    );

    private String getClientIpAddress(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        if (TRUSTED_PROXIES.contains(remoteAddr)) {
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return xForwardedFor.split(",")[0].trim();
            }
            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty()) {
                return xRealIp;
            }
        }
        return remoteAddr;
    }

    private void cleanupOldCounters() {
        long now = System.currentTimeMillis();
        long last = lastCleanup.get();
        if (now - last > CLEANUP_INTERVAL_MS && lastCleanup.compareAndSet(last, now)) {
            requestCounters.entrySet().removeIf(entry ->
                now - entry.getValue().getFirstRequestTime() > TIME_WINDOW_MS * 2
            );
            globalIpCounters.entrySet().removeIf(entry ->
                now - entry.getValue().getFirstRequestTime() > TIME_WINDOW_MS * 2
            );
        }
    }

    private static class RequestCounter {
        private final AtomicInteger count = new AtomicInteger(0);
        private volatile long firstRequestTime = System.currentTimeMillis();

        public int incrementAndGet() {
            return count.incrementAndGet();
        }

        public void reset(long time) {
            count.set(0);
            firstRequestTime = time;
        }

        public long getFirstRequestTime() {
            return firstRequestTime;
        }
    }
}
