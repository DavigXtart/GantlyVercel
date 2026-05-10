package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.service.CurrentUserService;
import com.alvaro.psicoapp.service.GdprService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@Tag(name = "GDPR", description = "APIs para exportacion y eliminacion de datos personales (RGPD)")
public class GdprController {
    private final CurrentUserService currentUserService;
    private final GdprService gdprService;

    public GdprController(CurrentUserService currentUserService, GdprService gdprService) {
        this.currentUserService = currentUserService;
        this.gdprService = gdprService;
    }

    @GetMapping("/export-data")
    @Transactional(readOnly = true)
    @Operation(summary = "Exportar mis datos (RGPD)", description = "Exporta todos los datos del usuario en formato JSON conforme al RGPD Art. 20")
    @ApiResponse(responseCode = "200", description = "Datos exportados exitosamente")
    public ResponseEntity<Map<String, Object>> exportMyData(Principal principal) {
        return ResponseEntity.ok(gdprService.exportUserData(currentUserService.getCurrentUser(principal)));
    }

    @DeleteMapping("/delete-account")
    @Transactional
    @Operation(summary = "Eliminar mi cuenta (RGPD)", description = "Elimina la cuenta del usuario y anonimiza datos conforme al RGPD Art. 17")
    @ApiResponse(responseCode = "200", description = "Cuenta eliminada exitosamente")
    public ResponseEntity<Map<String, String>> deleteMyAccount(Principal principal, @RequestBody Map<String, String> body) {
        String password = body != null ? body.get("password") : null;
        gdprService.deleteUserAccount(currentUserService.getCurrentUser(principal), password);
        return ResponseEntity.ok(Map.of("message", "Cuenta eliminada correctamente"));
    }
}
