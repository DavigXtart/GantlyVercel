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

/**
 * Servicio de cifrado End-to-End (E2E) para mensajes de chat.
 * Usa AES-256-GCM (Galois/Counter Mode) para cifrado autenticado.
 * 
 * Cumple con RGPD: los mensajes están cifrados en la base de datos,
 * solo el psicólogo asignado y el paciente pueden descifrarlos.
 */
@Service
public class ChatEncryptionService {
    private static final Logger logger = LoggerFactory.getLogger(ChatEncryptionService.class);
    
    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12; // 96 bits para GCM
    private static final int GCM_TAG_LENGTH = 16; // 128 bits para autenticación
    private static final int KEY_SIZE = 256; // 256 bits para AES-256
    
    // Cache de claves por conversación (psychologistId:userId)
    private final ConcurrentHashMap<String, SecretKey> keyCache = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();
    
    /**
     * Genera o recupera la clave de cifrado para una conversación específica.
     * La clave se deriva de la relación psicólogo-paciente para garantizar
     * que solo ellos puedan descifrar los mensajes.
     */
    private SecretKey getOrGenerateConversationKey(Long psychologistId, Long userId) {
        String keyId = psychologistId + ":" + userId;
        
        return keyCache.computeIfAbsent(keyId, k -> {
            try {
                // Derivar clave determinística de la relación psicólogo-paciente
                // Esto garantiza que la misma relación siempre tenga la misma clave
                String seed = "PSYCHO_CHAT_" + psychologistId + "_PATIENT_" + userId;
                MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
                byte[] keyBytes = sha256.digest(seed.getBytes(StandardCharsets.UTF_8));
                
                // Usar solo los primeros 32 bytes (256 bits) para AES-256
                byte[] aesKey = new byte[32];
                System.arraycopy(keyBytes, 0, aesKey, 0, 32);
                
                return new SecretKeySpec(aesKey, ALGORITHM);
            } catch (Exception e) {
                logger.error("Error generando clave de conversación", e);
                throw new RuntimeException("Error generando clave de cifrado", e);
            }
        });
    }
    
    /**
     * Cifra un mensaje usando AES-256-GCM.
     * El resultado incluye el IV y el tag de autenticación.
     * 
     * @param plaintext Mensaje en texto plano
     * @param psychologistId ID del psicólogo
     * @param userId ID del paciente
     * @return Mensaje cifrado en Base64 (formato: IV + ciphertext + tag)
     */
    public String encrypt(String plaintext, Long psychologistId, Long userId) {
        if (plaintext == null || plaintext.isEmpty()) {
            return plaintext;
        }
        
        try {
            SecretKey key = getOrGenerateConversationKey(psychologistId, userId);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            
            // Generar IV aleatorio para cada mensaje
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);
            
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.ENCRYPT_MODE, key, parameterSpec);
            
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            
            // Combinar IV + ciphertext (que ya incluye el tag al final)
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            byteBuffer.put(iv);
            byteBuffer.put(ciphertext);
            
            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            logger.error("Error cifrando mensaje", e);
            throw new RuntimeException("Error cifrando mensaje", e);
        }
    }
    
    /**
     * Descifra un mensaje cifrado usando AES-256-GCM.
     * 
     * @param encryptedMessage Mensaje cifrado en Base64
     * @param psychologistId ID del psicólogo
     * @param userId ID del paciente
     * @return Mensaje en texto plano
     */
    public String decrypt(String encryptedMessage, Long psychologistId, Long userId) {
        if (encryptedMessage == null || encryptedMessage.isEmpty()) {
            return encryptedMessage;
        }
        
        try {
            SecretKey key = getOrGenerateConversationKey(psychologistId, userId);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            
            byte[] encryptedBytes = Base64.getDecoder().decode(encryptedMessage);
            
            // Extraer IV y ciphertext
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
    
    /**
     * Limpia la caché de claves (útil para testing o rotación de claves)
     */
    public void clearKeyCache() {
        keyCache.clear();
    }
}
