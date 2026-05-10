package com.alvaro.psicoapp.config;

import com.alvaro.psicoapp.service.PiiEncryptionService;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA converter that transparently encrypts/decrypts PII fields
 * using deterministic AES-256-GCM (same plaintext → same ciphertext).
 *
 * Suitable for: email — any field that needs equality-based DB lookups
 * (findByEmail, unique constraints, etc.).
 */
@Converter
public class PiiDeterministicConverter implements AttributeConverter<String, String> {

    private static PiiEncryptionService encryptionService;

    /** Called once by {@link PiiConverterInitializer}. */
    public static void setEncryptionService(PiiEncryptionService service) {
        encryptionService = service;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (encryptionService == null) return attribute;
        return encryptionService.encryptDeterministic(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (encryptionService == null) return dbData;
        return encryptionService.decryptDeterministic(dbData);
    }
}
