package com.alvaro.psicoapp.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate limits WebSocket SEND messages to prevent abuse.
 * Allows a maximum of 10 messages per user per minute.
 */
@Component
public class WebSocketRateLimitInterceptor implements ChannelInterceptor {
    private static final Logger logger = LoggerFactory.getLogger(WebSocketRateLimitInterceptor.class);
    private static final int MAX_MESSAGES_PER_MINUTE = 10;

    // Maps user principal name -> rate limit tracker
    private final ConcurrentHashMap<String, RateLimitEntry> rateLimits = new ConcurrentHashMap<>();

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        StompCommand command = accessor.getCommand();
        if (!StompCommand.SEND.equals(command)) {
            return message;
        }

        java.security.Principal user = accessor.getUser();
        if (user == null) return message;

        String username = user.getName();
        if (username == null || username.isEmpty()) return message;

        RateLimitEntry entry = rateLimits.computeIfAbsent(username, k -> new RateLimitEntry());

        if (!entry.tryConsume()) {
            logger.warn("WebSocket rate limit exceeded for user: {}", username);
            throw new org.springframework.messaging.MessageDeliveryException(
                    "Rate limit exceeded: maximum " + MAX_MESSAGES_PER_MINUTE + " messages per minute");
        }

        return message;
    }

    /**
     * Cleanup old entries every 2 minutes to prevent memory leaks from disconnected users.
     */
    @Scheduled(fixedRate = 120000)
    public void cleanupOldEntries() {
        Instant cutoff = Instant.now().minusSeconds(120);
        rateLimits.entrySet().removeIf(entry -> entry.getValue().getLastActivity().isBefore(cutoff));
    }

    /**
     * Tracks message rate for a single user using a sliding window approach.
     */
    private static class RateLimitEntry {
        private final AtomicInteger count = new AtomicInteger(0);
        private volatile long windowStart = System.currentTimeMillis();
        private volatile Instant lastActivity = Instant.now();

        boolean tryConsume() {
            long now = System.currentTimeMillis();
            lastActivity = Instant.now();

            // Reset window if more than 60 seconds have passed
            if (now - windowStart > 60_000) {
                synchronized (this) {
                    if (now - windowStart > 60_000) {
                        windowStart = now;
                        count.set(0);
                    }
                }
            }

            int current = count.incrementAndGet();
            return current <= MAX_MESSAGES_PER_MINUTE;
        }

        Instant getLastActivity() {
            return lastActivity;
        }
    }
}
