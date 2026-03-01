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
            if (StompCommand.SEND.equals(command) || StompCommand.SUBSCRIBE.equals(command)) {
                logger.warn("WebSocket {} rechazado: sin header de autorizacion", command);
                throw new org.springframework.messaging.MessageDeliveryException("Autenticacion requerida");
            }
            return message;
        }

        String authHeader = authHeaders.get(0);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("Header de autorizacion no valido para comando: {}", command);
            if (StompCommand.SEND.equals(command) || StompCommand.SUBSCRIBE.equals(command)) {
                throw new org.springframework.messaging.MessageDeliveryException("Token no valido");
            }
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

            logger.debug("WebSocket {} autenticado: {} con rol: {}", command, subject, role);
        } catch (Exception e) {
            logger.error("Error autenticando WebSocket {}: {}", command, e.getMessage());
            if (StompCommand.CONNECT.equals(command) || StompCommand.SEND.equals(command)) {
                throw new org.springframework.messaging.MessageDeliveryException("Token JWT invalido");
            }
        }

        return message;
    }
}
