package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.EvaluationTestEntity;
import com.alvaro.psicoapp.domain.EvaluationTestResultEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.service.EvaluationTestService;
import com.alvaro.psicoapp.util.InputSanitizer;
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
import java.util.Map;

@RestController
@RequestMapping("/api/evaluation-tests")
@Tag(name = "Tests de Evaluación", description = "APIs para tests de evaluación psicológica por categoría y tema")
public class EvaluationTestController {
    private final EvaluationTestService evaluationTestService;
    private final UserRepository userRepository;

    public EvaluationTestController(EvaluationTestService evaluationTestService, UserRepository userRepository) {
        this.evaluationTestService = evaluationTestService;
        this.userRepository = userRepository;
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Obtener tests por categoría", description = "Obtiene todos los tests de evaluación de una categoría específica")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Tests obtenidos exitosamente"),
		@ApiResponse(responseCode = "400", description = "Error al obtener los tests")
	})
    public ResponseEntity<?> getTestsByCategory(@PathVariable String category) {
        try {
            List<EvaluationTestEntity> tests = evaluationTestService.getTestsByCategory(category);
            return ResponseEntity.ok(Map.of("tests", tests));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/category/{category}/topic/{topic}")
    @Operation(summary = "Obtener tests por categoría y tema", description = "Obtiene todos los tests de evaluación de una categoría y tema específicos")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Tests obtenidos exitosamente"),
		@ApiResponse(responseCode = "400", description = "Error al obtener los tests")
	})
    public ResponseEntity<?> getTestsByTopic(@PathVariable String category, @PathVariable String topic) {
        try {
            List<EvaluationTestEntity> tests = evaluationTestService.getTestsByTopic(category, topic);
            return ResponseEntity.ok(Map.of("tests", tests));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/all")
    @Operation(summary = "Obtener todos los tests de evaluación", description = "Obtiene todos los tests de evaluación activos")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Tests obtenidos exitosamente"),
		@ApiResponse(responseCode = "400", description = "Error al obtener los tests")
	})
    public ResponseEntity<?> getAllTests() {
        try {
            List<EvaluationTestEntity> tests = evaluationTestService.getAllActiveTests();
            return ResponseEntity.ok(Map.of("tests", tests));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{testId}/submit")
    @Operation(summary = "Enviar resultados de test de evaluación", description = "Envía los resultados de un test de evaluación completado")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Resultados guardados exitosamente"),
		@ApiResponse(responseCode = "400", description = "Error al guardar los resultados")
	})
    public ResponseEntity<?> submitResult(Principal principal, @PathVariable Long testId, @RequestBody com.alvaro.psicoapp.dto.EvaluationTestDtos.SubmitResultRequest req) {
        try {
            UserEntity user = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            EvaluationTestResultEntity result = evaluationTestService.saveResult(user.getId(), testId, req);
            return ResponseEntity.ok(Map.of("success", true, "result", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/results")
    @Operation(summary = "Obtener mis resultados de tests de evaluación", description = "Obtiene todos los resultados de tests de evaluación del usuario autenticado")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Resultados obtenidos exitosamente"),
		@ApiResponse(responseCode = "400", description = "Error al obtener los resultados")
	})
    public ResponseEntity<?> getUserResults(Principal principal) {
        try {
            UserEntity user = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            List<EvaluationTestResultEntity> results = evaluationTestService.getUserResults(user.getId());
            return ResponseEntity.ok(Map.of("results", results));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/statistics")
    @Operation(summary = "Obtener estadísticas de tests de evaluación", description = "Obtiene estadísticas de los tests de evaluación del usuario")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Estadísticas obtenidas exitosamente"),
		@ApiResponse(responseCode = "400", description = "Error al obtener las estadísticas")
	})
    public ResponseEntity<?> getUserStatistics(Principal principal) {
        try {
            UserEntity user = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            return ResponseEntity.ok(evaluationTestService.getUserStatistics(user.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
