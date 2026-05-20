package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * PII encryption migration — must be triggered manually via admin endpoint.
 * Encrypts all plaintext name/email/totpSecret values in the users table.
 *
 * Steps to activate PII encryption:
 * 1. POST /api/admin/pii/migrate (runs this service)
 * 2. Verify all rows are encrypted: SELECT count(*) FROM users WHERE email NOT LIKE 'DENC:%'
 * 3. Uncomment @Convert annotations in UserEntity
 * 4. Restart backend
 */
@Component
public class PiiMigrationRunner {
    private static final Logger logger = LoggerFactory.getLogger(PiiMigrationRunner.class);

    private final UserRepository userRepository;
    private final PiiEncryptionService piiEncryptionService;
    private final JdbcTemplate jdbcTemplate;

    public PiiMigrationRunner(UserRepository userRepository,
                              PiiEncryptionService piiEncryptionService,
                              JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.piiEncryptionService = piiEncryptionService;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Encrypts all plaintext PII in the users table using direct JDBC
     * (bypasses JPA converters so it works regardless of @Convert state).
     */
    @Transactional
    public int migrateAll() {
        var rows = jdbcTemplate.queryForList(
            "SELECT id, name, email, totp_secret FROM users WHERE email NOT LIKE 'DENC:%'");

        int migrated = 0;
        for (var row : rows) {
            Long id = ((Number) row.get("id")).longValue();
            String name = (String) row.get("name");
            String email = (String) row.get("email");
            String totp = (String) row.get("totp_secret");

            String encName = (name != null && !name.startsWith("ENC:"))
                    ? piiEncryptionService.encrypt(name) : name;
            String encEmail = (email != null && !email.startsWith("DENC:"))
                    ? piiEncryptionService.encryptDeterministic(email) : email;
            String encTotp = (totp != null && !totp.isEmpty() && !totp.startsWith("ENC:"))
                    ? piiEncryptionService.encrypt(totp) : totp;

            jdbcTemplate.update(
                "UPDATE users SET name = ?, email = ?, totp_secret = ? WHERE id = ?",
                encName, encEmail, encTotp, id);
            migrated++;
        }

        logger.info("PII migration complete: {} users encrypted", migrated);
        return migrated;
    }
}
