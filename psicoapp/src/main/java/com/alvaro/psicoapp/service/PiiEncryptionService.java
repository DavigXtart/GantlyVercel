package com.alvaro.psicoapp.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

/**
 * Field-level PII encryption at rest.
 *
 * Two modes:
 *   - Randomized (AES-256-GCM, random IV) for name, phone, etc.
 *     Prefix: "ENC:"
 *   - Deterministic (AES-256-GCM, HMAC-derived IV) for email lookups.
 *     Same plaintext always produces the same ciphertext so findByEmail / unique constraints work.
 *     Prefix: "DENC:"
 *
 * Backwards compatibility: decrypt methods return plaintext as-is when the prefix is missing,
 * so existing unencrypted rows keep working and get encrypted lazily on next save.
 */
@Service
public class PiiEncryptionService {
    private static final Logger logger = LoggerFactory.getLogger(PiiEncryptionService.class);

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_BITS = 128;

    private static final String ENC_PREFIX = "ENC:";
    private static final String DENC_PREFIX = "DENC:";

    private final SecretKey encryptionKey;
    private final SecretKey deterministicKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public PiiEncryptionService(
            @Value("${app.pii.encryption-key:dev-pii-key-change-in-production-32chars}") String masterKey) {
        try {
            // Derive two independent 256-bit keys from the master passphrase
            byte[] keyBytes = sha256(masterKey.getBytes(StandardCharsets.UTF_8));
            this.encryptionKey = new SecretKeySpec(keyBytes, ALGORITHM);

            byte[] detKeyBytes = sha256(("det-" + masterKey).getBytes(StandardCharsets.UTF_8));
            this.deterministicKey = new SecretKeySpec(detKeyBytes, ALGORITHM);
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialise PII encryption keys", e);
        }
    }

    // ── Randomized encryption (name, phone, etc.) ───────────────────────

    /**
     * AES-256-GCM with a random 12-byte IV. Each call produces different ciphertext.
     */
    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty()) return plaintext;
        if (plaintext.startsWith(ENC_PREFIX)) return plaintext; // already encrypted
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, encryptionKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            ByteBuffer buf = ByteBuffer.allocate(iv.length + ciphertext.length);
            buf.put(iv);
            buf.put(ciphertext);

            return ENC_PREFIX + Base64.getEncoder().encodeToString(buf.array());
        } catch (Exception e) {
            logger.error("PII randomized encryption failed", e);
            throw new RuntimeException("PII encryption error", e);
        }
    }

    /**
     * Decrypt a value produced by {@link #encrypt}. If the value has no "ENC:" prefix
     * it is returned as-is (backwards compatibility with plaintext data).
     */
    public String decrypt(String ciphertext) {
        if (ciphertext == null || ciphertext.isEmpty()) return ciphertext;
        if (!ciphertext.startsWith(ENC_PREFIX)) return ciphertext; // plaintext — backwards compat
        try {
            byte[] decoded = Base64.getDecoder().decode(ciphertext.substring(ENC_PREFIX.length()));
            ByteBuffer buf = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH];
            buf.get(iv);
            byte[] enc = new byte[buf.remaining()];
            buf.get(enc);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, encryptionKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
            return new String(cipher.doFinal(enc), StandardCharsets.UTF_8);
        } catch (Exception e) {
            logger.error("PII randomized decryption failed, returning raw value", e);
            return ciphertext; // fail-open for safety during migration
        }
    }

    // ── Deterministic encryption (email) ────────────────────────────────

    /**
     * AES-256-GCM with an IV deterministically derived from the plaintext via HMAC-SHA256.
     * Same plaintext + same key always yields the same ciphertext.
     */
    public String encryptDeterministic(String plaintext) {
        if (plaintext == null || plaintext.isEmpty()) return plaintext;
        if (plaintext.startsWith(DENC_PREFIX)) return plaintext; // already encrypted
        try {
            // Normalise email-like values to lower-case so lookups are case-insensitive
            String normalised = plaintext.toLowerCase(java.util.Locale.ROOT);

            // Derive a fixed IV from the plaintext using HMAC-SHA256 truncated to 12 bytes
            byte[] iv = deriveIv(normalised);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, deterministicKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] ciphertext = cipher.doFinal(normalised.getBytes(StandardCharsets.UTF_8));

            ByteBuffer buf = ByteBuffer.allocate(iv.length + ciphertext.length);
            buf.put(iv);
            buf.put(ciphertext);

            return DENC_PREFIX + Base64.getEncoder().encodeToString(buf.array());
        } catch (Exception e) {
            logger.error("PII deterministic encryption failed", e);
            throw new RuntimeException("PII deterministic encryption error", e);
        }
    }

    /**
     * Decrypt a value produced by {@link #encryptDeterministic}. If the value has no
     * "DENC:" prefix it is returned as-is (backwards compatibility).
     */
    public String decryptDeterministic(String ciphertext) {
        if (ciphertext == null || ciphertext.isEmpty()) return ciphertext;
        if (!ciphertext.startsWith(DENC_PREFIX)) return ciphertext; // plaintext — backwards compat
        try {
            byte[] decoded = Base64.getDecoder().decode(ciphertext.substring(DENC_PREFIX.length()));
            ByteBuffer buf = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH];
            buf.get(iv);
            byte[] enc = new byte[buf.remaining()];
            buf.get(enc);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, deterministicKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
            return new String(cipher.doFinal(enc), StandardCharsets.UTF_8);
        } catch (Exception e) {
            logger.error("PII deterministic decryption failed, returning raw value", e);
            return ciphertext; // fail-open for safety during migration
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    /** HMAC-SHA256, truncated to 12 bytes, used as the deterministic IV. */
    private byte[] deriveIv(String plaintext) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(deterministicKey);
        byte[] hash = mac.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
        return Arrays.copyOf(hash, GCM_IV_LENGTH);
    }

    private static byte[] sha256(byte[] input) throws Exception {
        return MessageDigest.getInstance("SHA-256").digest(input);
    }
}
