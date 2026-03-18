package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.ChatConversationEntity;
import com.alvaro.psicoapp.repository.ChatConversationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ChatEncryptionService {
    private static final Logger logger = LoggerFactory.getLogger(ChatEncryptionService.class);

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 16;
    private static final int PBKDF2_ITERATIONS = 100_000;
    private static final int SALT_LENGTH = 32;

    private final ConcurrentHashMap<String, SecretKey> keyCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, SecretKey> legacyKeyCache = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();
    private final ChatConversationRepository conversationRepository;

    public ChatEncryptionService(ChatConversationRepository conversationRepository) {
        this.conversationRepository = conversationRepository;
    }

    @Transactional
    public SecretKey getOrCreateKey(Long psychologistId, Long userId) {
        String keyId = psychologistId + ":" + userId;

        return keyCache.computeIfAbsent(keyId, k -> {
            try {
                ChatConversationEntity conv = conversationRepository
                    .findByPsychologistIdAndUserId(psychologistId, userId)
                    .orElseGet(() -> {
                        byte[] salt = new byte[SALT_LENGTH];
                        secureRandom.nextBytes(salt);
                        String saltBase64 = Base64.getEncoder().encodeToString(salt);
                        ChatConversationEntity newConv = new ChatConversationEntity(psychologistId, userId, saltBase64);
                        return conversationRepository.save(newConv);
                    });

                byte[] salt = Base64.getDecoder().decode(conv.getEncryptionSalt());
                String seed = "PSYCHO_CHAT_" + psychologistId + "_PATIENT_" + userId;

                SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
                KeySpec spec = new PBEKeySpec(seed.toCharArray(), salt, PBKDF2_ITERATIONS, 256);
                byte[] keyBytes = factory.generateSecret(spec).getEncoded();

                return new SecretKeySpec(keyBytes, ALGORITHM);
            } catch (Exception e) {
                logger.error("Error generando clave de conversación", e);
                throw new RuntimeException("Error generando clave de cifrado", e);
            }
        });
    }

    private SecretKey getLegacyKey(Long psychologistId, Long userId) {
        String keyId = psychologistId + ":" + userId;
        return legacyKeyCache.computeIfAbsent(keyId, k -> {
            try {
                String seed = "PSYCHO_CHAT_" + psychologistId + "_PATIENT_" + userId;
                MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
                byte[] keyBytes = sha256.digest(seed.getBytes(StandardCharsets.UTF_8));
                return new SecretKeySpec(keyBytes, ALGORITHM);
            } catch (Exception e) {
                throw new RuntimeException("Error generando clave legacy", e);
            }
        });
    }

    @Transactional
    public String encrypt(String plaintext, Long psychologistId, Long userId) {
        if (plaintext == null || plaintext.isEmpty()) {
            return plaintext;
        }

        try {
            SecretKey key = getOrCreateKey(psychologistId, userId);
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

    @Transactional
    public String decrypt(String encryptedMessage, Long psychologistId, Long userId) {
        if (encryptedMessage == null || encryptedMessage.isEmpty()) {
            return encryptedMessage;
        }

        // Try new PBKDF2 key first
        try {
            return decryptWithKey(encryptedMessage, getOrCreateKey(psychologistId, userId));
        } catch (Exception e) {
            // Fall back to legacy SHA-256 key for old messages
            try {
                return decryptWithKey(encryptedMessage, getLegacyKey(psychologistId, userId));
            } catch (Exception e2) {
                logger.error("Error descifrando mensaje (ambos métodos fallaron)", e2);
                throw new RuntimeException("Error descifrando mensaje", e2);
            }
        }
    }

    private String decryptWithKey(String encryptedMessage, SecretKey key) throws Exception {
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
    }

    public void clearKeyCache() {
        keyCache.clear();
        legacyKeyCache.clear();
    }
}
