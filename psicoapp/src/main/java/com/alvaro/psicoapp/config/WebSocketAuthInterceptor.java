package com.alvaro.psicoapp.config;

import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.security.JwtService;
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
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public WebSocketAuthInterceptor(UserRepository userRepository) {
        this.jwtService = new JwtService(
            System.getenv().getOrDefault("JWT_SECRET", "dev-secret-key-32-bytes-minimo-dev-seed"), 
            1000L * 60 * 60 * 24
        );
        this.userRepository = userRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null) {
            StompCommand command = accessor.getCommand();
            
            if (StompCommand.CONNECT.equals(command) || StompCommand.SEND.equals(command) || StompCommand.SUBSCRIBE.equals(command)) {
                List<String> authHeaders = accessor.getNativeHeader("Authorization");
                
                if (authHeaders != null && !authHeaders.isEmpty()) {
                    String authHeader = authHeaders.get(0);
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
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
                            
                            // Establecer en el accessor Y en el SecurityContext
                            accessor.setUser(auth);
                            SecurityContextHolder.getContext().setAuthentication(auth);
                            
                            if (StompCommand.CONNECT.equals(command)) {
                                System.out.println("✅ WebSocket CONNECT autenticado: " + subject + " con rol: " + role);
                            } else if (StompCommand.SEND.equals(command)) {
                                System.out.println("✅ WebSocket SEND autenticado: " + subject + " con rol: " + role);
                                System.out.println("   Destino: " + accessor.getDestination());
                            } else if (StompCommand.SUBSCRIBE.equals(command)) {
                                System.out.println("✅ WebSocket SUBSCRIBE autenticado: " + subject + " con rol: " + role);
                                System.out.println("   Topic: " + accessor.getDestination());
                            }
                        } catch (Exception e) {
                            System.err.println("❌ Error autenticando WebSocket " + command + ": " + e.getMessage());
                            e.printStackTrace();
                        }
                    } else {
                        System.err.println("⚠️ Header de autorización no válido para comando: " + command);
                    }
                } else {
                    if (StompCommand.SEND.equals(command)) {
                        System.err.println("⚠️ No hay header de autorización en mensaje SEND");
                    }
                }
            }
        }
        
        return message;
    }
}

