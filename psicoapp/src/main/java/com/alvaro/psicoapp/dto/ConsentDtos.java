package com.alvaro.psicoapp.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;

public final class ConsentDtos {
    private ConsentDtos() {}

    public record DocumentTypeDto(Long id, String code, String title, String formSchema, Boolean active) {}

    public record CreateConsentRequest(Long userId, Long documentTypeId, String place) {}

    public record ConsentRequestDto(
            Long id,
            Long userId,
            String userName,
            Long psychologistId,
            Long documentTypeId,
            String documentTitle,
            String documentCode,
            String formSchema,
            String status,
            String place,
            Instant sentAt,
            Instant signedAt,
            String signerName,
            String renderedContent,
            String formData,
            String signatureData,
            String pdfUrl
    ) {}

    public record SignConsentRequest(String signerName, String signatureData, String formData) {}

    public record ConsentStatusSummary(
            Long userId,
            @JsonProperty("isMinor") Boolean isMinor,
            String consentStatus,
            Long latestConsentId
    ) {}
}
