package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * One-time migration: encrypts existing plaintext PII rows on startup.
 * Uses ApplicationReadyEvent to guarantee PiiConverterInitializer has already
 * set the encryption service on the JPA converters.
 * Idempotent — already-encrypted rows are re-saved harmlessly.
 */
@Component
public class PiiMigrationRunner {
    private static final Logger logger = LoggerFactory.getLogger(PiiMigrationRunner.class);

    private final UserRepository userRepository;

    public PiiMigrationRunner(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void migratePlaintextPii() {
        try {
            List<UserEntity> all = userRepository.findAll();
            int migrated = 0;
            for (UserEntity u : all) {
                // Always save — the JPA converter handles encryption transparently.
                // Already-encrypted values pass through decrypt→encrypt round-trip.
                userRepository.save(u);
                migrated++;
                if (migrated % 100 == 0) {
                    logger.info("PII migration: {} users processed so far", migrated);
                }
            }
            if (migrated > 0) {
                logger.info("PII migration complete: {} users processed", migrated);
            } else {
                logger.info("PII migration: no users to process");
            }
        } catch (Exception e) {
            logger.error("PII migration failed — will retry on next restart", e);
        }
    }
}
