package com.alvaro.psicoapp.config;

import com.alvaro.psicoapp.service.PiiEncryptionService;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

/**
 * Bridges Spring-managed {@link PiiEncryptionService} into the static
 * JPA {@link jakarta.persistence.AttributeConverter} instances which
 * cannot receive constructor injection.
 */
@Component
public class PiiConverterInitializer {

    private final PiiEncryptionService encryptionService;

    public PiiConverterInitializer(PiiEncryptionService encryptionService) {
        this.encryptionService = encryptionService;
    }

    @PostConstruct
    public void init() {
        PiiEncryptConverter.setEncryptionService(encryptionService);
        PiiDeterministicConverter.setEncryptionService(encryptionService);
    }
}
