package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.service.CompanyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/company")
@Tag(name = "Empresa", description = "APIs para gestión de empresas y sus psicólogos. Requiere rol EMPRESA")
public class CompanyController {

    private static final String COMPANY_PREFIX = "company:";

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    private String getCompanyEmail(Principal principal) {
        if (principal == null) return null;
        String subject = principal.getName();
        if (subject != null && subject.startsWith(COMPANY_PREFIX)) {
            return subject.substring(COMPANY_PREFIX.length());
        }
        return null;
    }

    @GetMapping("/me")
    @Operation(summary = "Obtener información de la empresa", description = "Obtiene la información de la empresa autenticada")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Información obtenida exitosamente"),
		@ApiResponse(responseCode = "401", description = "No autenticado")
	})
    public ResponseEntity<CompanyService.CompanyMeDto> getMe(Principal principal) {
        String email = getCompanyEmail(principal);
        if (email == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(companyService.getMe(email));
    }

    @GetMapping("/psychologists")
    @Operation(summary = "Listar psicólogos de la empresa", description = "Obtiene la lista de psicólogos asociados a la empresa")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Lista de psicólogos obtenida exitosamente"),
		@ApiResponse(responseCode = "401", description = "No autenticado")
	})
    public ResponseEntity<List<CompanyService.CompanyPsychologistSummaryDto>> getPsychologists(Principal principal) {
        String email = getCompanyEmail(principal);
        if (email == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(companyService.getPsychologists(email));
    }

    @GetMapping("/psychologists/{psychologistId}")
    @Operation(summary = "Obtener detalles de psicólogo", description = "Obtiene información detallada de un psicólogo de la empresa")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Detalles obtenidos exitosamente"),
		@ApiResponse(responseCode = "401", description = "No autenticado")
	})
    public ResponseEntity<CompanyService.CompanyPsychologistDetailDto> getPsychologistDetail(
            Principal principal, @PathVariable Long psychologistId) {
        String email = getCompanyEmail(principal);
        if (email == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(companyService.getPsychologistDetail(email, psychologistId));
    }
}
