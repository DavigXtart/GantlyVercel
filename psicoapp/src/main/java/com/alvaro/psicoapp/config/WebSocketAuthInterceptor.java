package com.alvaro.psicoapp.config;

import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

/**
 * WebSocket STOMP interceptor that enforces authentication and destination validation.
 *
 * Security model:
 * - CONNECT: Requires valid JWT in Authorization header. Stores auth in session.
 * - SEND/SUBSCRIBE: Requires authenticated session (set during CONNECT).
 * - SUBSCRIBE: Additionally validates destination against allowed patterns.
 * - Other commands (DISCONNECT, ACK, etc.): Pass through.
 */
@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {
    private static final Logger logger = LoggerFactory.getLogger(WebSocketAuthInterceptor.class);

    /** Allowed SUBSCRIBE destination patterns */
    private static final List<Pattern> ALLOWED_DESTINATIONS = List.of(
        Pattern.compile("^/topic/chat/[\\w-]+(/[\\w-]+)?$"),  // /topic/chat/{id} or /topic/chat/{psychId}/{userId}
        Pattern.compile("^/topic/notifications/[\\w@.+-]+$"), // /topic/notifications/{userId}
        Pattern.compile("^/user/queue/.*$")                  // /user/queue/* (user-specific queues)
    );

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

        if (StompCommand.CONNECT.equals(command)) {
            handleConnect(accessor);
        } else if (StompCommand.SEND.equals(command)) {
            requireAuthenticatedSession(accessor, "SEND");
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            requireAuthenticatedSession(accessor, "SUBSCRIBE");
            validateDestination(accessor);
        }
        // Other commands (DISCONNECT, ACK, NACK, etc.) pass through

        return message;
    }

    /**
     * Authenticates the CONNECT command. Requires a valid JWT.
     * Stores the authenticated principal in the STOMP session for subsequent messages.
     */
    private void handleConnect(StompHeaderAccessor accessor) {
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        if (authHeaders == null || authHeaders.isEmpty()) {
            logger.warn("WebSocket CONNECT rechazado: sin header de autorizacion");
            throw new MessageDeliveryException("Autenticacion requerida para conectar");
        }

        String authHeader = authHeaders.get(0);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("WebSocket CONNECT rechazado: header de autorizacion invalido");
            throw new MessageDeliveryException("Formato de token invalido");
        }

        String token = authHeader.substring(7);
        try {
            String subject = jwtService.parseSubject(token);
            String role = userRepository.findByEmail(subject)
                .map(u -> u.getRole())
                .orElse("USER");

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                subject, null, List.of(new SimpleGrantedAuthority("ROLE_" + role))
            );

            // Store auth in the STOMP session — subsequent SEND/SUBSCRIBE will inherit it
            accessor.setUser(auth);
            logger.debug("WebSocket CONNECT autenticado: {} con rol: {}", subject, role);
        } catch (Exception e) {
            logger.error("WebSocket CONNECT rechazado: token JWT invalido: {}", e.getMessage());
            throw new MessageDeliveryException("Token JWT invalido");
        }
    }

    /**
     * Ensures the STOMP session was authenticated during CONNECT.
     */
    private void requireAuthenticatedSession(StompHeaderAccessor accessor, String commandName) {
        if (accessor.getUser() == null) {
            logger.warn("WebSocket {} rechazado: sesion no autenticada", commandName);
            throw new MessageDeliveryException("Sesion no autenticada. Conecte primero con un token valido.");
        }
    }

    /**
     * Validates that SUBSCRIBE destinations match allowed patterns.
     * Prevents clients from subscribing to arbitrary broker destinations.
     */
    private void validateDestination(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || destination.isEmpty()) {
            throw new MessageDeliveryException("Destino de suscripcion requerido");
        }

        boolean allowed = ALLOWED_DESTINATIONS.stream()
            .anyMatch(pattern -> pattern.matcher(destination).matches());

        if (!allowed) {
            logger.warn("WebSocket SUBSCRIBE rechazado: destino no permitido: {}", destination);
            throw new MessageDeliveryException("Destino de suscripcion no permitido: " + destination);
        }
    }
}
