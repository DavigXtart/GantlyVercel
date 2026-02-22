package com.alvaro.psicoapp.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ChatEncryptionService {
    private static final Logger logger = LoggerFactory.getLogger(ChatEncryptionService.class);

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 16;
    private static final int KEY_SIZE = 256;

    private final ConcurrentHashMap<String, SecretKey> keyCache = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    private SecretKey getOrGenerateConversationKey(Long psychologistId, Long userId) {
        String keyId = psychologistId + ":" + userId;

        return keyCache.computeIfAbsent(keyId, k -> {
            try {

                String seed = "PSYCHO_CHAT_" + psychologistId + "_PATIENT_" + userId;
                MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
                byte[] keyBytes = sha256.digest(seed.getBytes(StandardCharsets.UTF_8));

                byte[] aesKey = new byte[32];
                System.arraycopy(keyBytes, 0, aesKey, 0, 32);

                return new SecretKeySpec(aesKey, ALGORITHM);
            } catch (Exception e) {
                logger.error("Error generando clave de conversación", e);
                throw new RuntimeException("Error generando clave de cifrado", e);
            }
        });
    }

    public String encrypt(String plaintext, Long psychologistId, Long userId) {
        if (plaintext == null || plaintext.isEmpty()) {
            return plaintext;
        }

        try {
            SecretKey key = getOrGenerateConversationKey(psychologistId, userId);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);

            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);

            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.ENCRYPT_MODE, key, parameterSpec);

            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            byteBuffer.put(iv);
            byteBuffer.put(ciphertext);

            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            logger.error("Error cifrando mensaje", e);
            throw new RuntimeException("Error cifrando mensaje", e);
        }
    }

    public String decrypt(String encryptedMessage, Long psychologistId, Long userId) {
        if (encryptedMessage == null || encryptedMessage.isEmpty()) {
            return encryptedMessage;
        }

        try {
            SecretKey key = getOrGenerateConversationKey(psychologistId, userId);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);

            byte[] encryptedBytes = Base64.getDecoder().decode(encryptedMessage);

            ByteBuffer byteBuffer = ByteBuffer.wrap(encryptedBytes);
            byte[] iv = new byte[GCM_IV_LENGTH];
            byteBuffer.get(iv);
            byte[] ciphertext = new byte[byteBuffer.remaining()];
            byteBuffer.get(ciphertext);

            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.DECRYPT_MODE, key, parameterSpec);

            byte[] plaintext = cipher.doFinal(ciphertext);
            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (Exception e) {
            logger.error("Error descifrando mensaje", e);
            throw new RuntimeException("Error descifrando mensaje", e);
        }
    }

    public void clearKeyCache() {
        keyCache.clear();
    }
}
