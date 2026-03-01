package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.dto.UserProfileDtos;
import com.alvaro.psicoapp.service.CurrentUserService;
import com.alvaro.psicoapp.service.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@Tag(name = "Perfil de Usuario", description = "APIs para gestión del perfil de usuario, selección de psicólogo y avatar")
public class UserProfileController {
    private final CurrentUserService currentUserService;
    private final UserProfileService userProfileService;

    public UserProfileController(CurrentUserService currentUserService, UserProfileService userProfileService) {
        this.currentUserService = currentUserService;
        this.userProfileService = userProfileService;
    }

    @GetMapping
    @Transactional(readOnly = true)
    @Operation(summary = "Obtener mi perfil", description = "Obtiene el perfil completo del usuario autenticado")
    @ApiResponse(responseCode = "200", description = "Perfil obtenido exitosamente")
    public ResponseEntity<UserProfileDtos.UserProfileDto> getMe(Principal principal) {
        return ResponseEntity.ok(userProfileService.getMe(currentUserService.getCurrentUser(principal)));
    }

    @GetMapping("/my-psychologist")
    @Transactional(readOnly = true)
    @Operation(summary = "Obtener mi psicólogo asignado", description = "Obtiene información del psicólogo asignado al usuario")
    @ApiResponse(responseCode = "200", description = "Información del psicólogo obtenida exitosamente")
    public ResponseEntity<UserProfileDtos.MyPsychologistResponse> myPsychologist(Principal principal) {
        return ResponseEntity.ok(userProfileService.myPsychologist(currentUserService.getCurrentUser(principal)));
    }

    @PostMapping("/select-psychologist")
    @Transactional
    @Operation(summary = "Seleccionar psicólogo", description = "Asigna un psicólogo al usuario autenticado")
    @ApiResponse(responseCode = "200", description = "Psicólogo seleccionado exitosamente")
    public ResponseEntity<UserProfileDtos.SelectPsychologistResponse> selectPsychologist(Principal principal, @RequestBody UserProfileDtos.SelectPsychologistRequest req) {
        return ResponseEntity.ok(userProfileService.selectPsychologist(currentUserService.getCurrentUser(principal), req));
    }

    @PostMapping("/use-referral-code")
    @Transactional
    @Operation(summary = "Usar código de referencia", description = "Asigna un psicólogo al usuario usando un código de referencia")
    @ApiResponse(responseCode = "200", description = "Código de referencia aplicado exitosamente")
    public ResponseEntity<UserProfileDtos.UseReferralCodeResponse> useReferralCode(Principal principal, @RequestBody UserProfileDtos.UseReferralCodeRequest req) {
        return ResponseEntity.ok(userProfileService.useReferralCode(currentUserService.getCurrentUser(principal), req));
    }

    @GetMapping("/psychologist/{psychologistId}")
    @Transactional(readOnly = true)
    @Operation(summary = "Obtener perfil de psicólogo", description = "Obtiene el perfil detallado de un psicólogo específico")
    @ApiResponse(responseCode = "200", description = "Perfil del psicólogo obtenido exitosamente")
    public ResponseEntity<UserProfileDtos.PsychologistProfileDetailDto> getPsychologistProfile(Principal principal, @PathVariable Long psychologistId) {
        return ResponseEntity.ok(userProfileService.getPsychologistProfile(currentUserService.getCurrentUser(principal), psychologistId));
    }

    @PutMapping
    @Transactional
    @Operation(summary = "Actualizar perfil", description = "Actualiza los datos del perfil del usuario autenticado")
    @ApiResponse(responseCode = "200", description = "Perfil actualizado exitosamente")
    public ResponseEntity<Void> updateProfile(Principal principal, @RequestBody UserProfileDtos.UpdateProfileRequest req) {
        userProfileService.updateProfile(currentUserService.getCurrentUser(principal), req);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/avatar")
    @Operation(summary = "Subir avatar", description = "Sube o actualiza la imagen de avatar del usuario")
    @ApiResponse(responseCode = "200", description = "Avatar subido exitosamente")
    public ResponseEntity<UserProfileDtos.AvatarResponse> uploadAvatar(Principal principal, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userProfileService.uploadAvatar(currentUserService.getCurrentUser(principal), file));
    }

    @GetMapping("/export-data")
    @Transactional(readOnly = true)
    @Operation(summary = "Exportar mis datos (RGPD)", description = "Exporta todos los datos del usuario en formato JSON conforme al RGPD Art. 20")
    @ApiResponse(responseCode = "200", description = "Datos exportados exitosamente")
    public ResponseEntity<Map<String, Object>> exportMyData(Principal principal) {
        return ResponseEntity.ok(userProfileService.exportUserData(currentUserService.getCurrentUser(principal)));
    }

    @DeleteMapping("/delete-account")
    @Transactional
    @Operation(summary = "Eliminar mi cuenta (RGPD)", description = "Elimina la cuenta del usuario y todos sus datos conforme al RGPD Art. 17")
    @ApiResponse(responseCode = "200", description = "Cuenta eliminada exitosamente")
    public ResponseEntity<Map<String, String>> deleteMyAccount(Principal principal) {
        userProfileService.deleteAccount(currentUserService.getCurrentUser(principal));
        return ResponseEntity.ok(Map.of("message", "Cuenta eliminada correctamente"));
    }
}
