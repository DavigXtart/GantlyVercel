package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.TestEntity;
import com.alvaro.psicoapp.dto.TestDtos;
import com.alvaro.psicoapp.service.TestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tests")
public class TestController {
	private final TestService testService;

	public TestController(TestService testService) {
		this.testService = testService;
	}

	@GetMapping
	public List<TestEntity> list() { 
		return testService.listTestsWithoutQuestions();
	}

	@GetMapping("/{id}")
	public ResponseEntity<TestDtos.TestDetailResponse> get(@PathVariable Long id) {
		return testService.getTestDetail(id)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}
}