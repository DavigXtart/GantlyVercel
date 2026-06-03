package com.alvaro.psicoapp.config;

import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * WebSocket STOMP interceptor that enforces authentication, destination validation,
 * and subscription authorization.
 *
 * Security model:
 * - CONNECT: Requires valid JWT in Authorization header. Stores auth in session.
 * - SEND/SUBSCRIBE: Requires authenticated session (set during CONNECT).
 * - SUBSCRIBE: Validates destination against allowed patterns AND authorizes
 *   the user for the specific channel (e.g., only chat participants can subscribe).
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

    /** Pattern to extract IDs from chat topic: /topic/chat/{psychologistId}/{userId} */
    private static final Pattern CHAT_TOPIC_PATTERN =
        Pattern.compile("^/topic/chat/(\\d+)/(\\d+)$");

    /** Pattern to extract identifier from notifications topic: /topic/notifications/{identifier} */
    private static final Pattern NOTIFICATIONS_TOPIC_PATTERN =
        Pattern.compile("^/topic/notifications/(.+)$");

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;

    public WebSocketAuthInterceptor(JwtService jwtService,
                                    UserRepository userRepository,
                                    UserPsychologistRepository userPsychologistRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
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
            authorizeSubscription(accessor);
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

    /**
     * Authorizes the authenticated user for the specific subscription destination.
     * Ensures users can only subscribe to channels they are a participant of.
     *
     * - Chat topics: user must be either the psychologist or the patient in the conversation,
     *   and a valid patient-psychologist relationship must exist.
     * - Notification topics: user can only subscribe to their own notification channel.
     * - User queues (/user/queue/*): inherently user-scoped by Spring, no extra check needed.
     * - ADMIN role bypasses all authorization checks.
     */
    private void authorizeSubscription(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        String principalEmail = accessor.getUser().getName();

        // Look up the authenticated user
        UserEntity currentUser = userRepository.findByEmail(principalEmail).orElse(null);
        if (currentUser == null) {
            logger.warn("WebSocket SUBSCRIBE rechazado: usuario no encontrado para email: {}", principalEmail);
            throw new MessageDeliveryException("Usuario no encontrado");
        }

        // ADMIN bypasses subscription authorization
        if (RoleConstants.ADMIN.equals(currentUser.getRole())) {
            logger.debug("WebSocket SUBSCRIBE permitido para ADMIN {} a {}", currentUser.getId(), destination);
            return;
        }

        // Check chat topic authorization
        Matcher chatMatcher = CHAT_TOPIC_PATTERN.matcher(destination);
        if (chatMatcher.matches()) {
            authorizeChatSubscription(currentUser, chatMatcher, destination);
            return;
        }

        // Check notification topic authorization
        Matcher notifMatcher = NOTIFICATIONS_TOPIC_PATTERN.matcher(destination);
        if (notifMatcher.matches()) {
            authorizeNotificationSubscription(currentUser, notifMatcher, destination);
            return;
        }

        // /user/queue/* — Spring's user-destination handling scopes these automatically
        // No additional authorization needed
    }

    /**
     * Authorizes chat topic subscription.
     * The user must be either the psychologist or the patient identified in the topic,
     * and a valid relationship must exist between them.
     */
    private void authorizeChatSubscription(UserEntity currentUser, Matcher chatMatcher, String destination) {
        Long psychologistId = Long.parseLong(chatMatcher.group(1));
        Long userId = Long.parseLong(chatMatcher.group(2));
        Long currentUserId = currentUser.getId();

        // User must be one of the two participants
        boolean isParticipant = currentUserId.equals(psychologistId) || currentUserId.equals(userId);
        if (!isParticipant) {
            logger.warn("WebSocket SUBSCRIBE rechazado: usuario {} no es participante del chat {}", currentUserId, destination);
            throw new MessageDeliveryException("No autorizado para suscribirse a este chat");
        }

        // Verify that a valid patient-psychologist relationship exists
        var relationship = userPsychologistRepository.findByUserId(userId);
        if (relationship.isEmpty() || !relationship.get().getPsychologist().getId().equals(psychologistId)) {
            logger.warn("WebSocket SUBSCRIBE rechazado: no existe relacion psicologo-paciente para chat {}", destination);
            throw new MessageDeliveryException("No autorizado para suscribirse a este chat");
        }

        logger.debug("WebSocket SUBSCRIBE autorizado: usuario {} al chat {}", currentUserId, destination);
    }

    /**
     * Authorizes notification topic subscription.
     * Users can only subscribe to their own notification channel, identified by
     * their numeric ID or email.
     */
    private void authorizeNotificationSubscription(UserEntity currentUser, Matcher notifMatcher, String destination) {
        String identifier = notifMatcher.group(1);

        // Check if the identifier matches the user's numeric ID or email
        boolean isOwner = identifier.equals(String.valueOf(currentUser.getId()))
            || identifier.equals(currentUser.getEmail());

        if (!isOwner) {
            logger.warn("WebSocket SUBSCRIBE rechazado: usuario {} intento suscribirse a notificaciones de {}", currentUser.getId(), identifier);
            throw new MessageDeliveryException("No autorizado para suscribirse a estas notificaciones");
        }

        logger.debug("WebSocket SUBSCRIBE autorizado: usuario {} a notificaciones {}", currentUser.getId(), destination);
    }
}
