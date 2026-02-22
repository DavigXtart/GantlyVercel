package com.alvaro.psicoapp.config;

import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {
    private static final Logger logger = LoggerFactory.getLogger(WebSocketAuthInterceptor.class);
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public WebSocketAuthInterceptor(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) return message;

        StompCommand command = accessor.getCommand();
        if (command == null) return message;
        if (!(StompCommand.CONNECT.equals(command) || StompCommand.SEND.equals(command) || StompCommand.SUBSCRIBE.equals(command))) {
            return message;
        }

        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        if (authHeaders == null || authHeaders.isEmpty()) {
            if (StompCommand.SEND.equals(command)) logger.warn("No hay header de autorización en mensaje SEND");
            return message;
        }

        String authHeader = authHeaders.get(0);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("Header de autorización no válido para comando: {}", command);
            return message;
        }

        String token = authHeader.substring(7);
        try {
            String subject = jwtService.parseSubject(token);
            String role = userRepository.findByEmail(subject)
                .map(u -> u.getRole())
                .orElse("USER");

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                subject,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
            );

            accessor.setUser(auth);
            SecurityContextHolder.getContext().setAuthentication(auth);

            String destination = accessor.getDestination() != null ? accessor.getDestination() : "";
            switch (command) {
                case CONNECT ->
                    logger.debug("WebSocket CONNECT autenticado: {} con rol: {}", subject, role);
                case SEND ->
                    logger.debug("WebSocket SEND autenticado: {} con rol: {}, Destino: {}", subject, role, destination);
                case SUBSCRIBE ->
                    logger.debug("WebSocket SUBSCRIBE autenticado: {} con rol: {}, Topic: {}", subject, role, destination);
                default -> {  }
            }
        } catch (Exception e) {
            logger.error("Error autenticando WebSocket {}: {}", command, e.getMessage(), e);
        }

        return message;
    }
}
