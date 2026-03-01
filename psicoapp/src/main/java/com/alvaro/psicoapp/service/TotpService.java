package com.alvaro.psicoapp.service;

import dev.samstevens.totp.code.*;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.springframework.stereotype.Service;

import java.util.Base64;

@Service
public class TotpService {
    private final DefaultSecretGenerator secretGenerator = new DefaultSecretGenerator();

    public String generateSecret() {
        return secretGenerator.generate();
    }

    public String getQrCodeDataUri(String secret, String email) {
        QrData data = new QrData.Builder()
                .label(email)
                .secret(secret)
                .issuer("Gantly")
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();
        try {
            ZxingPngQrGenerator generator = new ZxingPngQrGenerator();
            byte[] imageData = generator.generate(data);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(imageData);
        } catch (QrGenerationException e) {
            throw new RuntimeException("Error generando código QR", e);
        }
    }

    public boolean verifyCode(String secret, String code) {
        CodeVerifier verifier = new DefaultCodeVerifier(
                new DefaultCodeGenerator(),
                new SystemTimeProvider()
        );
        return verifier.isValidCode(secret, code);
    }
}
