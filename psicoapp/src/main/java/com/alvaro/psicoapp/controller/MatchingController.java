package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.dto.MatchingDtos;
import com.alvaro.psicoapp.service.CurrentUserService;
import com.alvaro.psicoapp.service.MatchingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/matching")
@Tag(name = "Matching", description = "APIs para tests de matching y búsqueda de psicólogos compatibles")
public class MatchingController {
    private static final String PATIENT_MATCHING_TEST_CODE = "PATIENT_MATCHING";
    private static final String PSYCHOLOGIST_MATCHING_TEST_CODE = "PSYCHOLOGIST_MATCHING";

    private final CurrentUserService currentUserService;
    private final MatchingService matchingService;

    public MatchingController(CurrentUserService currentUserService, MatchingService matchingService) {
        this.currentUserService = currentUserService;
        this.matchingService = matchingService;
    }

    @GetMapping("/patient-test")
    @Transactional(readOnly = true)
    @Operation(summary = "Obtener test de matching para paciente", description = "Obtiene el test de matching que deben completar los pacientes")
    @ApiResponse(responseCode = "200", description = "Test obtenido exitosamente")
    public ResponseEntity<?> getPatientMatchingTest(Principal principal) {
        return ResponseEntity.ok(matchingService.getMatchingTest(PATIENT_MATCHING_TEST_CODE));
    }

    @GetMapping("/psychologist-test")
    @Transactional(readOnly = true)
    @Operation(summary = "Obtener test de matching para psicólogo", description = "Obtiene el test de matching que deben completar los psicólogos")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Test obtenido exitosamente"),
		@ApiResponse(responseCode = "403", description = "Solo psicólogos pueden acceder a este test")
	})
    public ResponseEntity<?> getPsychologistMatchingTest(Principal principal) {
        var user = currentUserService.getCurrentUser(principal);
        if (!RoleConstants.PSYCHOLOGIST.equals(user.getRole())) {
            return ResponseEntity.status(403).body(new MatchingDtos.MatchingErrorResponse("Solo psicólogos pueden acceder a este test"));
        }
        return ResponseEntity.ok(matchingService.getMatchingTest(PSYCHOLOGIST_MATCHING_TEST_CODE));
    }

    @PostMapping("/patient-test/submit")
    @Transactional
    @Operation(summary = "Enviar respuestas del test de matching de paciente", description = "Envía las respuestas del test de matching del paciente")
    @ApiResponse(responseCode = "200", description = "Test completado exitosamente")
    public ResponseEntity<MatchingDtos.MatchingMessageResponse> submitPatientMatchingTest(Principal principal, @RequestBody MatchingDtos.SubmitMatchingRequest req) {
        var user = currentUserService.getCurrentUser(principal);
        matchingService.saveMatchingTestAnswers(user, PATIENT_MATCHING_TEST_CODE, req);
        return ResponseEntity.ok(new MatchingDtos.MatchingMessageResponse(true, "Test de matching completado"));
    }

    @PostMapping("/psychologist-test/submit")
    @Transactional
    @Operation(summary = "Enviar respuestas del test de matching de psicólogo", description = "Envía las respuestas del test de matching del psicólogo")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Test completado exitosamente"),
		@ApiResponse(responseCode = "403", description = "Solo psicólogos pueden acceder a este test")
	})
    public ResponseEntity<?> submitPsychologistMatchingTest(Principal principal, @RequestBody MatchingDtos.SubmitMatchingRequest req) {
        var user = currentUserService.getCurrentUser(principal);
        if (!RoleConstants.PSYCHOLOGIST.equals(user.getRole())) {
            return ResponseEntity.status(403).body(new MatchingDtos.MatchingErrorResponse("Solo psicólogos pueden acceder a este test"));
        }
        matchingService.saveMatchingTestAnswers(user, PSYCHOLOGIST_MATCHING_TEST_CODE, req);
        return ResponseEntity.ok(new MatchingDtos.MatchingMessageResponse(true, "Test de matching completado"));
    }

    @GetMapping("/psychologists")
    @Transactional(readOnly = true)
    @Operation(summary = "Obtener psicólogos compatibles", description = "Obtiene la lista de psicólogos compatibles basados en el test de matching del paciente")
    @ApiResponse(responseCode = "200", description = "Psicólogos compatibles obtenidos exitosamente")
    public ResponseEntity<?> getMatchingPsychologists(Principal principal) {
        var patient = currentUserService.getCurrentUser(principal);
        return ResponseEntity.ok(matchingService.getMatchingPsychologistsWithRatings(patient.getId()));
    }

    @GetMapping("/psychologist-test/status")
    @Transactional(readOnly = true)
    @Operation(summary = "Obtener estado del test de matching de psicólogo", description = "Verifica si el psicólogo ha completado su test de matching")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Estado obtenido exitosamente"),
		@ApiResponse(responseCode = "403", description = "Solo psicólogos pueden acceder a este endpoint")
	})
    public ResponseEntity<?> getPsychologistMatchingTestStatus(Principal principal) {
        var user = currentUserService.getCurrentUser(principal);
        if (!RoleConstants.PSYCHOLOGIST.equals(user.getRole())) {
            return ResponseEntity.status(403).body(new MatchingDtos.MatchingErrorResponse("Solo psicólogos pueden acceder a este endpoint"));
        }
        return ResponseEntity.ok(Map.of("completed", matchingService.getPsychologistMatchingTestStatus(user)));
    }
}
