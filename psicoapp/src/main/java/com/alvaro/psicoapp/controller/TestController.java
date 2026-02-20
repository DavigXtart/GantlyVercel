package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.TestEntity;
import com.alvaro.psicoapp.dto.TestDtos;
import com.alvaro.psicoapp.service.TestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tests")
@Tag(name = "Tests", description = "APIs públicas para consultar tests disponibles")
public class TestController {
	private final TestService testService;

	public TestController(TestService testService) {
		this.testService = testService;
	}

	@GetMapping
	@Operation(summary = "Listar tests disponibles", description = "Obtiene la lista de todos los tests disponibles (sin preguntas)")
	@ApiResponse(responseCode = "200", description = "Lista de tests obtenida exitosamente")
	public List<TestEntity> list() { 
		return testService.listTestsWithoutQuestions();
	}

	@GetMapping("/{id}")
	@Operation(summary = "Obtener detalles de test", description = "Obtiene los detalles completos de un test incluyendo preguntas y respuestas")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Test encontrado", 
			content = @Content(schema = @Schema(implementation = TestDtos.TestDetailResponse.class))),
		@ApiResponse(responseCode = "404", description = "Test no encontrado")
	})
	public ResponseEntity<TestDtos.TestDetailResponse> get(@PathVariable Long id) {
		return testService.getTestDetail(id)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}
}