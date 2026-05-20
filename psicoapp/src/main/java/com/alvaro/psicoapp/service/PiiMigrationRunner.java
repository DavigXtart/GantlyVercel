package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * One-time migration: encrypts existing plaintext PII rows on startup.
 * Idempotent — already-encrypted rows (prefixed ENC:/DENC:) are skipped by converters.
 */
@Component
public class PiiMigrationRunner {
    private static final Logger logger = LoggerFactory.getLogger(PiiMigrationRunner.class);

    private final UserRepository userRepository;

    public PiiMigrationRunner(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostConstruct
    public void migratePlaintextPii() {
        try {
            doMigrate();
        } catch (Exception e) {
            logger.error("PII migration failed — will retry on next restart", e);
        }
    }

    @Transactional
    public void doMigrate() {
        List<UserEntity> all = userRepository.findAll();
        int migrated = 0;
        for (UserEntity u : all) {
            boolean needsSave = false;
            // Check if name is plaintext (not yet encrypted)
            if (u.getName() != null && !u.getName().startsWith("ENC:")) {
                needsSave = true;
            }
            // Check if email is plaintext (not yet encrypted)
            if (u.getEmail() != null && !u.getEmail().startsWith("DENC:")) {
                needsSave = true;
            }
            // Check if totpSecret is plaintext
            if (u.getTotpSecret() != null && !u.getTotpSecret().startsWith("ENC:")) {
                needsSave = true;
            }
            if (needsSave) {
                userRepository.save(u);
                migrated++;
                if (migrated % 100 == 0) {
                    logger.info("PII migration: {} users encrypted so far", migrated);
                }
            }
        }
        if (migrated > 0) {
            logger.info("PII migration complete: {} users encrypted", migrated);
        } else {
            logger.info("PII migration: all users already encrypted");
        }
    }
}
