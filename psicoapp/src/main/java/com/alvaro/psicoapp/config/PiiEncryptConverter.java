package com.alvaro.psicoapp.config;

import com.alvaro.psicoapp.service.PiiEncryptionService;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA converter that transparently encrypts/decrypts PII fields
 * using randomized AES-256-GCM (different ciphertext each time).
 *
 * Suitable for: name, phone, etc. — any field that does NOT need
 * equality-based DB lookups.
 */
@Converter
public class PiiEncryptConverter implements AttributeConverter<String, String> {

    private static PiiEncryptionService encryptionService;

    /** Called once by {@link PiiConverterInitializer}. */
    public static void setEncryptionService(PiiEncryptionService service) {
        encryptionService = service;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (encryptionService == null) return attribute;
        return encryptionService.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (encryptionService == null) return dbData;
        return encryptionService.decrypt(dbData);
    }
}
