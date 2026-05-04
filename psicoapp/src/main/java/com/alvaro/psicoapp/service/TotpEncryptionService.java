package com.alvaro.psicoapp.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import java.util.Base64;

/**
 * Encrypts and decrypts TOTP secrets at rest using AES-256-GCM.
 * Uses a fixed application-level key derived via PBKDF2 from a config property.
 */
@Service
public class TotpEncryptionService {
    private static final Logger logger = LoggerFactory.getLogger(TotpEncryptionService.class);

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 16;
    private static final int PBKDF2_ITERATIONS = 100_000;
    private static final byte[] FIXED_SALT = "GantlyTotpEncryptionSalt2026".getBytes(StandardCharsets.UTF_8);

    private final SecureRandom secureRandom = new SecureRandom();
    private final SecretKey encryptionKey;

    public TotpEncryptionService(
            @Value("${app.totp.encryption-key:G4ntly-T0tp-Encrypt10n-K3y-2026-S3cur3!}") String keyPassphrase) {
        this.encryptionKey = deriveKey(keyPassphrase);
    }

    private SecretKey deriveKey(String passphrase) {
        try {
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            KeySpec spec = new PBEKeySpec(passphrase.toCharArray(), FIXED_SALT, PBKDF2_ITERATIONS, 256);
            byte[] keyBytes = factory.generateSecret(spec).getEncoded();
            return new SecretKeySpec(keyBytes, ALGORITHM);
        } catch (Exception e) {
            logger.error("Error deriving TOTP encryption key", e);
            throw new RuntimeException("Error deriving TOTP encryption key", e);
        }
    }

    /**
     * Encrypts a plaintext TOTP secret. Returns a Base64-encoded string containing IV + ciphertext.
     */
    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty()) {
            return plaintext;
        }
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.ENCRYPT_MODE, encryptionKey, parameterSpec);
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            byteBuffer.put(iv);
            byteBuffer.put(ciphertext);
            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            logger.error("Error encrypting TOTP secret", e);
            throw new RuntimeException("Error encrypting TOTP secret", e);
        }
    }

    /**
     * Decrypts an encrypted TOTP secret.
     * Falls back to returning the value as-is if decryption fails (for backwards compatibility
     * with plaintext secrets stored before encryption was enabled).
     */
    public String decrypt(String encrypted) {
        if (encrypted == null || encrypted.isEmpty()) {
            return encrypted;
        }
        try {
            byte[] encryptedBytes = Base64.getDecoder().decode(encrypted);
            ByteBuffer byteBuffer = ByteBuffer.wrap(encryptedBytes);
            byte[] iv = new byte[GCM_IV_LENGTH];
            byteBuffer.get(iv);
            byte[] ciphertext = new byte[byteBuffer.remaining()];
            byteBuffer.get(ciphertext);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.DECRYPT_MODE, encryptionKey, parameterSpec);
            byte[] plaintext = cipher.doFinal(ciphertext);
            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (Exception e) {
            // Backwards compatibility: if decryption fails, assume it's a plaintext secret
            // (stored before encryption was introduced)
            logger.debug("TOTP secret decryption failed, assuming plaintext (legacy): {}", e.getMessage());
            return encrypted;
        }
    }
}
