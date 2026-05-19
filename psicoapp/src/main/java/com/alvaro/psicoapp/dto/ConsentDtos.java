package com.alvaro.psicoapp.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;

public final class ConsentDtos {
    private ConsentDtos() {}

    public record DocumentTypeDto(Long id, String code, String title, Boolean active) {}

    public record CreateConsentRequest(Long userId, Long documentTypeId, String place) {}

    public record ConsentRequestDto(
            Long id,
            Long userId,
            Long psychologistId,
            Long documentTypeId,
            String documentTitle,
            String status,
            String place,
            Instant sentAt,
            Instant signedAt,
            String signerName,
            String renderedContent,
            String signatureData,
            String pdfUrl
    ) {}

    public record SignConsentRequest(String signerName, String signatureData) {}

    public record ConsentStatusSummary(
            Long userId,
            @JsonProperty("isMinor") Boolean isMinor,
            String consentStatus,
            Long latestConsentId
    ) {}
}
