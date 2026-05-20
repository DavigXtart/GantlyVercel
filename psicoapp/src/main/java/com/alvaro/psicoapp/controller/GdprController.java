package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.security.filter.JwtAuthFilter;
import com.alvaro.psicoapp.service.CurrentUserService;
import com.alvaro.psicoapp.service.GdprService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@Tag(name = "GDPR", description = "APIs para exportacion y eliminacion de datos personales (RGPD)")
public class GdprController {
    private final CurrentUserService currentUserService;
    private final GdprService gdprService;
    private final UserRepository userRepository;

    public GdprController(CurrentUserService currentUserService, GdprService gdprService, UserRepository userRepository) {
        this.currentUserService = currentUserService;
        this.gdprService = gdprService;
        this.userRepository = userRepository;
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

    @PostMapping("/consent/withdraw-health-data")
    @Transactional
    @Operation(summary = "Retirar consentimiento datos de salud (RGPD Art. 7.3)",
               description = "Retira el consentimiento para el tratamiento de datos de salud. No elimina datos (retención legal 5 años).")
    @ApiResponse(responseCode = "200", description = "Consentimiento retirado")
    public ResponseEntity<Map<String, String>> withdrawHealthDataConsent(Principal principal) {
        gdprService.withdrawHealthDataConsent(currentUserService.getCurrentUser(principal));
        return ResponseEntity.ok(Map.of("message", "Consentimiento de datos de salud retirado correctamente"));
    }

    @PostMapping("/consent/renew")
    @Transactional
    @Operation(summary = "Renovar consentimiento RGPD",
               description = "Actualiza la versión de consentimiento del usuario a la versión actual de la política de privacidad.")
    @ApiResponse(responseCode = "200", description = "Consentimiento renovado")
    public ResponseEntity<Map<String, String>> renewConsent(Principal principal) {
        UserEntity user = currentUserService.getCurrentUser(principal);
        user.setGdprConsentVersion(JwtAuthFilter.CURRENT_CONSENT_VERSION);
        user.setGdprConsentAt(Instant.now());
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Consentimiento actualizado correctamente"));
    }
}
