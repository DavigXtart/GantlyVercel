package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.TestEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.TestResultDtos;
import com.alvaro.psicoapp.repository.TestRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.service.ExcelExportService;
import com.alvaro.psicoapp.service.TestResultService;
import com.alvaro.psicoapp.service.TestResultExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/results")
@Tag(name = "Resultados de Tests", description = "APIs para consultar y exportar resultados de tests")
public class TestResultController {
    private final UserRepository userRepository;
    private final TestRepository testRepository;
    private final TestResultService testResultService;
    private final ExcelExportService excelExportService;
    private final TestResultExportService testResultExportService;

    public TestResultController(UserRepository userRepository, TestRepository testRepository,
                                TestResultService testResultService, ExcelExportService excelExportService,
                                TestResultExportService testResultExportService) {
        this.userRepository = userRepository;
        this.testRepository = testRepository;
        this.testResultService = testResultService;
        this.excelExportService = excelExportService;
        this.testResultExportService = testResultExportService;
    }

    @GetMapping("/my-results")
    @Operation(summary = "Obtener mis resultados", description = "Obtiene todos los resultados de tests del usuario autenticado")
    @ApiResponse(responseCode = "200", description = "Resultados obtenidos exitosamente")
    public ResponseEntity<TestResultDtos.MyResultsResponse> getMyResults(Principal principal) {
        UserEntity user = userRepository.findByEmail(principal.getName()).orElseThrow();
        return ResponseEntity.ok(testResultService.getMyResults(user));
    }

    @GetMapping("/test/{testId}")
    @Operation(summary = "Obtener resultados de un test", description = "Obtiene los resultados del usuario autenticado para un test específico")
    @ApiResponse(responseCode = "200", description = "Resultados obtenidos exitosamente")
    public ResponseEntity<TestResultDtos.TestResultsResponse> getTestResults(Principal principal, @PathVariable Long testId) {
        UserEntity user = userRepository.findByEmail(principal.getName()).orElseThrow();
        return ResponseEntity.ok(testResultService.getTestResults(user, testId));
    }

    @GetMapping("/user/{userId}/test/{testId}")
    @Operation(summary = "Obtener resultados de usuario para un test", description = "Obtiene los resultados de un usuario específico para un test (solo psicólogos asignados)")
    @ApiResponse(responseCode = "200", description = "Resultados obtenidos exitosamente")
    @ApiResponse(responseCode = "403", description = "No autorizado - solo el psicólogo asignado puede ver estos datos")
    public ResponseEntity<TestResultDtos.UserTestResultsResponse> getUserTestResults(Principal principal, @PathVariable Long userId, @PathVariable Long testId) {
        UserEntity requester = userRepository.findByEmail(principal.getName()).orElseThrow();
        return ResponseEntity.ok(testResultService.getUserTestResults(requester, userId, testId));
    }

    @GetMapping("/user/{userId}/test/{testId}/export")
    @Operation(summary = "Exportar resultados de usuario para un test", description = "Exporta los resultados de un usuario para un test en formato Excel (solo psicólogos asignados)")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Archivo Excel generado exitosamente", 
			content = @Content(mediaType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")),
		@ApiResponse(responseCode = "403", description = "No autorizado - solo el psicólogo asignado puede exportar"),
		@ApiResponse(responseCode = "500", description = "Error al generar el archivo")
	})
    public ResponseEntity<byte[]> exportUserTestResults(Principal principal, @PathVariable Long userId, @PathVariable Long testId) {
        try {
            UserEntity requester = userRepository.findByEmail(principal.getName()).orElseThrow();
            return testResultExportService.exportUserTestResults(requester, userId, testId);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/user/{userId}/export")
    @Operation(summary = "Exportar todos los resultados de usuario", description = "Exporta todos los resultados de un usuario en formato Excel (solo psicólogos asignados)")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Archivo Excel generado exitosamente"),
		@ApiResponse(responseCode = "403", description = "No autorizado - solo el psicólogo asignado puede exportar"),
		@ApiResponse(responseCode = "500", description = "Error al generar el archivo")
	})
    public ResponseEntity<byte[]> exportUserAllResults(Principal principal, @PathVariable Long userId) {
        try {
            UserEntity requester = userRepository.findByEmail(principal.getName()).orElseThrow();
            return testResultExportService.exportUserAllResults(requester, userId);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/test/{testId}/recalculate")
    @Operation(summary = "Recalcular resultados", description = "Recalcula los resultados de un test para el usuario autenticado")
    @ApiResponse(responseCode = "200", description = "Resultados recalculados exitosamente")
    public ResponseEntity<Void> recalculateResults(Principal principal, @PathVariable Long testId) {
        testResultExportService.recalculateForUserTest(principal.getName(), testId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/export")
    @Operation(summary = "Exportar mis resultados", description = "Exporta todos los resultados del usuario autenticado en formato Excel")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Archivo Excel generado exitosamente"),
		@ApiResponse(responseCode = "500", description = "Error al generar el archivo")
	})
    public ResponseEntity<byte[]> exportMyResults(Principal principal) {
        try {
            return testResultExportService.exportMyResults(principal.getName());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/test/{testId}/export")
    @Operation(summary = "Exportar resultados de un test", description = "Exporta los resultados del usuario autenticado para un test específico en formato Excel")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Archivo Excel generado exitosamente"),
		@ApiResponse(responseCode = "500", description = "Error al generar el archivo")
	})
    public ResponseEntity<byte[]> exportTestResults(Principal principal, @PathVariable Long testId) {
        try {
            return testResultExportService.exportMyTestResults(principal.getName(), testId);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
