package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.dto.TestFlowDtos;
import com.alvaro.psicoapp.service.TestFlowService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/flow")
public class TestFlowController {
	private final TestFlowService testFlowService;

	public TestFlowController(
			TestFlowService testFlowService) {
		this.testFlowService = testFlowService;
	}

	@PostMapping("/submit")
	@Transactional
	public ResponseEntity<Void> submit(Principal principal, @RequestBody TestFlowDtos.SubmitRequest req) {
		testFlowService.submit(principal.getName(), req);
		return ResponseEntity.ok().build();
	}
}