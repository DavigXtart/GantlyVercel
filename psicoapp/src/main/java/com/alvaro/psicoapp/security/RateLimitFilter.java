package com.alvaro.psicoapp.security;

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

/**
 * Filtro simple de rate limiting para prevenir abuso de la API
 * Limita las peticiones por IP y endpoint
 */
@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(RateLimitFilter.class);
    
    // Configuración de rate limiting
    private static final int MAX_REQUESTS_PER_MINUTE = 60;
    private static final int MAX_REQUESTS_PER_MINUTE_AUTH = 30; // Más restrictivo para endpoints autenticados
    private static final long TIME_WINDOW_MS = 60_000; // 1 minuto
    
    // Almacenar contadores por IP y endpoint
    private final Map<String, RequestCounter> requestCounters = new ConcurrentHashMap<>();
    
    // Limpiar contadores antiguos periódicamente
    private long lastCleanup = System.currentTimeMillis();
    private static final long CLEANUP_INTERVAL_MS = 300_000; // 5 minutos
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                   FilterChain filterChain) throws ServletException, IOException {
        
        // Limpiar contadores antiguos periódicamente
        cleanupOldCounters();
        
        String ipAddress = getClientIpAddress(request);
        String endpoint = request.getRequestURI();
        String key = ipAddress + ":" + endpoint;
        
        // Determinar límite según el endpoint
        boolean isAuthEndpoint = endpoint.startsWith("/api/auth/");
        boolean isPublicEndpoint = endpoint.startsWith("/api/tests/") || 
                                   endpoint.startsWith("/api/initial-test/") ||
                                   endpoint.startsWith("/uploads/");
        
        int maxRequests = isAuthEndpoint ? MAX_REQUESTS_PER_MINUTE_AUTH : MAX_REQUESTS_PER_MINUTE;
        
        // Obtener o crear contador
        RequestCounter counter = requestCounters.computeIfAbsent(key, k -> new RequestCounter());
        
        long now = System.currentTimeMillis();
        
        // Resetear contador si ha pasado la ventana de tiempo
        if (now - counter.getFirstRequestTime() > TIME_WINDOW_MS) {
            counter.reset(now);
        }
        
        // Verificar límite
        int currentCount = counter.incrementAndGet();
        
        if (currentCount > maxRequests) {
            logger.warn("Rate limit excedido para IP: {} en endpoint: {} ({} requests)", 
                       ipAddress, endpoint, currentCount);
            response.setStatus(429); // SC_TOO_MANY_REQUESTS (429)
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Demasiadas peticiones. Por favor intenta más tarde.\"}");
            return;
        }
        
        // Agregar headers informativos
        response.setHeader("X-RateLimit-Limit", String.valueOf(maxRequests));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, maxRequests - currentCount)));
        
        filterChain.doFilter(request, response);
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
    
    private void cleanupOldCounters() {
        long now = System.currentTimeMillis();
        if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
            requestCounters.entrySet().removeIf(entry -> 
                now - entry.getValue().getFirstRequestTime() > TIME_WINDOW_MS * 2
            );
            lastCleanup = now;
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

