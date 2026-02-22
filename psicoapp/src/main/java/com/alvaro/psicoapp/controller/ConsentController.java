package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.dto.ConsentDtos;
import com.alvaro.psicoapp.service.ConsentService;
import com.alvaro.psicoapp.service.CurrentUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/consent")
@Tag(name = "Consentimientos", description = "Gestión de consentimientos (menores de edad). Psicólogo envía, paciente firma.")
public class ConsentController {
    private final CurrentUserService currentUserService;
    private final ConsentService consentService;

    public ConsentController(CurrentUserService currentUserService, ConsentService consentService) {
        this.currentUserService = currentUserService;
        this.consentService = consentService;
    }

    @GetMapping("/document-types")
    @Operation(summary = "Listar tipos de documentos de consentimiento activos")
    @ApiResponse(responseCode = "200", description = "OK")
    public ResponseEntity<List<ConsentDtos.DocumentTypeDto>> listDocTypes() {
        return ResponseEntity.ok(consentService.listActiveDocumentTypes());
    }

    @PostMapping("/requests")
    @Operation(summary = "Enviar consentimiento a un paciente (psicólogo)", description = "Crea y envía un consentimiento para un paciente menor de edad")
    @ApiResponse(responseCode = "200", description = "OK")
    public ResponseEntity<ConsentDtos.ConsentRequestDto> createAndSend(Principal principal, @RequestBody ConsentDtos.CreateConsentRequest req) {
        return ResponseEntity.ok(consentService.createAndSend(currentUserService.getCurrentUser(principal), req));
    }

    @GetMapping("/requests/me")
    @Operation(summary = "Mis consentimientos pendientes (paciente)", description = "Lista consentimientos pendientes de firma para el usuario autenticado")
    @ApiResponse(responseCode = "200", description = "OK")
    public ResponseEntity<List<ConsentDtos.ConsentRequestDto>> myPending(Principal principal) {
        return ResponseEntity.ok(consentService.myPendingConsents(currentUserService.getCurrentUser(principal)));
    }

    @PostMapping("/requests/{consentId}/sign")
    @Operation(summary = "Firmar consentimiento (paciente)")
    @ApiResponse(responseCode = "200", description = "OK")
    public ResponseEntity<ConsentDtos.ConsentRequestDto> sign(Principal principal, @PathVariable Long consentId, @RequestBody ConsentDtos.SignConsentRequest req) {
        return ResponseEntity.ok(consentService.sign(currentUserService.getCurrentUser(principal), consentId, req));
    }
}
