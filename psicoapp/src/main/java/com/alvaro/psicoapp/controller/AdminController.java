package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.dto.AdminDtos;
import com.alvaro.psicoapp.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Administración", description = "APIs para gestión administrativa de tests, preguntas, respuestas y usuarios. Requiere rol ADMIN")
public class AdminController {
    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);
    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/tests")
    @Operation(summary = "Listar todos los tests", description = "Obtiene la lista de todos los tests del sistema")
    @ApiResponse(responseCode = "200", description = "Lista de tests obtenida exitosamente")
    public List<TestEntity> listTests() {
        return adminService.listTests();
    }

    @GetMapping("/tests/{id}")
    @Operation(summary = "Obtener test con detalles", description = "Obtiene un test específico con todas sus preguntas y respuestas")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Test encontrado", 
			content = @Content(schema = @Schema(implementation = TestEntity.class))),
		@ApiResponse(responseCode = "404", description = "Test no encontrado")
	})
    public ResponseEntity<TestEntity> getTestWithDetails(@PathVariable Long id) {
        return adminService.getTestWithDetails(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/tests")
    @Operation(summary = "Crear nuevo test", description = "Crea un nuevo test en el sistema")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Test creado exitosamente", 
			content = @Content(schema = @Schema(implementation = TestEntity.class))),
		@ApiResponse(responseCode = "400", description = "Datos inválidos")
	})
    public ResponseEntity<TestEntity> createTest(@RequestBody AdminDtos.TestCreate req) {
        return ResponseEntity.ok(adminService.createTest(req));
    }

    @PutMapping("/tests/{id}")
    @Operation(summary = "Actualizar test", description = "Actualiza los datos de un test existente")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "204", description = "Test actualizado exitosamente"),
		@ApiResponse(responseCode = "404", description = "Test no encontrado")
	})
    public ResponseEntity<Void> updateTest(@PathVariable Long id, @RequestBody AdminDtos.TestUpdate req) {
        return adminService.updateTest(id, req)
                .map(t -> ResponseEntity.noContent().<Void>build())
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/tests/{id}")
    @Operation(summary = "Eliminar test", description = "Elimina un test del sistema")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Test eliminado exitosamente"),
		@ApiResponse(responseCode = "404", description = "Test no encontrado")
	})
    public ResponseEntity<Void> deleteTest(@PathVariable Long id) {
        return adminService.deleteTest(id) ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/tests/{testId}/structure")
    @Operation(summary = "Obtener estructura del test", description = "Obtiene la estructura completa del test (factores, subfactores, preguntas)")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Estructura obtenida exitosamente"),
		@ApiResponse(responseCode = "404", description = "Test no encontrado")
	})
    public ResponseEntity<Map<String, Object>> getTestStructure(@PathVariable Long testId) {
        return adminService.getTestStructure(testId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/factors")
    @Operation(summary = "Crear factor", description = "Crea un nuevo factor para un test")
    @ApiResponse(responseCode = "200", description = "Factor creado exitosamente")
    public ResponseEntity<AdminDtos.FactorCreateResponse> createFactor(@RequestBody AdminDtos.FactorCreate req) {
        return ResponseEntity.ok(adminService.createFactor(req));
    }

    @PostMapping("/subfactors")
    @Operation(summary = "Crear subfactor", description = "Crea un nuevo subfactor para un factor")
    @ApiResponse(responseCode = "200", description = "Subfactor creado exitosamente")
    public ResponseEntity<Map<String, Object>> createSubfactor(@RequestBody AdminDtos.SubfactorCreate req) {
        return ResponseEntity.ok(adminService.createSubfactor(req));
    }

    @PostMapping("/tests/{testId}/init-structure")
    @Operation(summary = "Inicializar estructura por defecto", description = "Inicializa la estructura por defecto de factores y subfactores para un test")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Estructura inicializada exitosamente"),
		@ApiResponse(responseCode = "400", description = "Error al inicializar la estructura")
	})
    public ResponseEntity<?> initDefaultStructure(@PathVariable Long testId) {
        try {
            return ResponseEntity.ok(adminService.initDefaultStructure(testId));
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getReason()));
        }
    }

    @GetMapping("/tests/{testId}/questions")
    @Operation(summary = "Listar preguntas de un test", description = "Obtiene todas las preguntas de un test específico")
    @ApiResponse(responseCode = "200", description = "Lista de preguntas obtenida exitosamente")
    public List<AdminDtos.QuestionDto> getQuestions(@PathVariable Long testId) {
        return adminService.getQuestions(testId);
    }

    @PostMapping("/questions")
    @Operation(summary = "Crear pregunta", description = "Crea una nueva pregunta para un test")
    @ApiResponse(responseCode = "200", description = "Pregunta creada exitosamente")
    public ResponseEntity<AdminDtos.QuestionCreateResponse> createQuestion(@RequestBody AdminDtos.QuestionCreate req) {
        return ResponseEntity.ok(adminService.createQuestion(req));
    }

    @PutMapping("/questions/{id}")
    @Operation(summary = "Actualizar pregunta", description = "Actualiza los datos de una pregunta existente")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Pregunta actualizada exitosamente"),
		@ApiResponse(responseCode = "404", description = "Pregunta no encontrada")
	})
    public ResponseEntity<QuestionEntity> updateQuestion(@PathVariable Long id, @RequestBody AdminDtos.QuestionUpdate req) {
        return adminService.updateQuestion(id, req)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/questions/{id}/subfactor")
    @Operation(summary = "Asignar subfactor a pregunta", description = "Asigna un subfactor a una pregunta específica")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Subfactor asignado exitosamente"),
		@ApiResponse(responseCode = "404", description = "Pregunta o subfactor no encontrado")
	})
    public ResponseEntity<Void> setQuestionSubfactor(@PathVariable Long id, @RequestBody AdminDtos.SetSubfactorReq req) {
        return adminService.setQuestionSubfactor(id, req) ? ResponseEntity.ok().<Void>build() : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/questions/{id}")
    @Operation(summary = "Eliminar pregunta", description = "Elimina una pregunta del sistema")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Pregunta eliminada exitosamente"),
		@ApiResponse(responseCode = "404", description = "Pregunta no encontrada")
	})
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        return adminService.deleteQuestion(id) ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/questions/{questionId}/answers")
    @Operation(summary = "Listar respuestas de una pregunta", description = "Obtiene todas las respuestas posibles de una pregunta")
    @ApiResponse(responseCode = "200", description = "Lista de respuestas obtenida exitosamente")
    public ResponseEntity<List<AdminDtos.AnswerDto>> getAnswers(@PathVariable Long questionId) {
        return ResponseEntity.ok(adminService.getAnswers(questionId));
    }

    @PostMapping("/answers")
    @Operation(summary = "Crear respuesta", description = "Crea una nueva respuesta para una pregunta")
    @ApiResponse(responseCode = "200", description = "Respuesta creada exitosamente")
    public ResponseEntity<AnswerEntity> createAnswer(@RequestBody AdminDtos.AnswerCreate req) {
        return ResponseEntity.ok(adminService.createAnswer(req));
    }

    @PutMapping("/answers/{id}")
    @Operation(summary = "Actualizar respuesta", description = "Actualiza los datos de una respuesta existente")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Respuesta actualizada exitosamente"),
		@ApiResponse(responseCode = "404", description = "Respuesta no encontrada")
	})
    public ResponseEntity<AnswerEntity> updateAnswer(@PathVariable Long id, @RequestBody AdminDtos.AnswerUpdate req) {
        return adminService.updateAnswer(id, req)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/answers/{id}")
    @Operation(summary = "Eliminar respuesta", description = "Elimina una respuesta del sistema")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Respuesta eliminada exitosamente"),
		@ApiResponse(responseCode = "404", description = "Respuesta no encontrada")
	})
    public ResponseEntity<Void> deleteAnswer(@PathVariable Long id) {
        return adminService.deleteAnswer(id) ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/users")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @Operation(summary = "Listar usuarios", description = "Obtiene la lista de todos los usuarios del sistema")
    @ApiResponse(responseCode = "200", description = "Lista de usuarios obtenida exitosamente")
    public List<AdminDtos.UserListDto> listUsers() {
        return adminService.listUsers();
    }

    @GetMapping("/users/{userId}")
    @Operation(summary = "Obtener detalles de usuario", description = "Obtiene información detallada de un usuario específico")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Usuario encontrado"),
		@ApiResponse(responseCode = "404", description = "Usuario no encontrado")
	})
    public ResponseEntity<AdminDtos.UserDetailDto> getUserDetails(@PathVariable Long userId) {
        return adminService.getUserDetails(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tests/{testId}/user-answers")
    @Operation(summary = "Obtener respuestas de usuarios a un test", description = "Obtiene todas las respuestas de usuarios para un test específico")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Respuestas obtenidas exitosamente"),
		@ApiResponse(responseCode = "404", description = "Test no encontrado")
	})
    public ResponseEntity<List<AdminDtos.UserTestAnswersDto>> getTestUserAnswers(@PathVariable Long testId) {
        return adminService.getTestUserAnswers(testId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/evaluation-tests")
    @Operation(summary = "Listar tests de evaluación", description = "Obtiene la lista de todos los tests de evaluación")
    @ApiResponse(responseCode = "200", description = "Lista de tests de evaluación obtenida exitosamente")
    public List<EvaluationTestEntity> listEvaluationTests() {
        return adminService.listEvaluationTests();
    }

    @GetMapping("/evaluation-tests/{id}")
    @Operation(summary = "Obtener test de evaluación", description = "Obtiene un test de evaluación específico")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Test de evaluación encontrado"),
		@ApiResponse(responseCode = "404", description = "Test de evaluación no encontrado")
	})
    public ResponseEntity<EvaluationTestEntity> getEvaluationTest(@PathVariable Long id) {
        return adminService.getEvaluationTest(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/evaluation-tests")
    @Operation(summary = "Crear test de evaluación", description = "Crea un nuevo test de evaluación")
    @ApiResponse(responseCode = "200", description = "Test de evaluación creado exitosamente")
    public ResponseEntity<EvaluationTestEntity> createEvaluationTest(@RequestBody AdminDtos.EvaluationTestCreate req) {
        return ResponseEntity.ok(adminService.createEvaluationTest(req));
    }

    @PutMapping("/evaluation-tests/{id}")
    @Operation(summary = "Actualizar test de evaluación", description = "Actualiza los datos de un test de evaluación existente")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Test de evaluación actualizado exitosamente"),
		@ApiResponse(responseCode = "404", description = "Test de evaluación no encontrado")
	})
    public ResponseEntity<EvaluationTestEntity> updateEvaluationTest(@PathVariable Long id, @RequestBody AdminDtos.EvaluationTestUpdate req) {
        return adminService.updateEvaluationTest(id, req)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/evaluation-tests/{id}")
    @Operation(summary = "Eliminar test de evaluación", description = "Elimina un test de evaluación del sistema")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Test de evaluación eliminado exitosamente"),
		@ApiResponse(responseCode = "404", description = "Test de evaluación no encontrado")
	})
    public ResponseEntity<Void> deleteEvaluationTest(@PathVariable Long id) {
        return adminService.deleteEvaluationTest(id) ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/statistics")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @Operation(summary = "Obtener estadísticas del sistema", description = "Obtiene estadísticas generales del sistema")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Estadísticas obtenidas exitosamente"),
		@ApiResponse(responseCode = "400", description = "Error al obtener estadísticas")
	})
    public ResponseEntity<?> getStatistics() {
        try {
            return ResponseEntity.ok(adminService.getStatistics());
        } catch (Exception e) {
            logger.error("Error obteniendo estadísticas", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
