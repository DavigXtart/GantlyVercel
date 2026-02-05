package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.AssignedTestDtos;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.service.AssignedTestService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/assigned-tests")
@CrossOrigin(origins = "*")
public class AssignedTestController {
    private final AssignedTestService assignedTestService;
    private final UserRepository userRepository;

    public AssignedTestController(AssignedTestService assignedTestService, UserRepository userRepository) {
        this.assignedTestService = assignedTestService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<AssignedTestDtos.AssignedTestDto>> myAssignedTests(Principal principal) {
        if (principal == null) return ResponseEntity.ok(Collections.emptyList());
        UserEntity user = userRepository.findByEmail(principal.getName()).orElse(null);
        if (user == null) return ResponseEntity.ok(Collections.emptyList());
        return ResponseEntity.ok(assignedTestService.myAssignedTests(user));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> assignTest(Principal principal, @RequestBody AssignedTestDtos.AssignTestRequest req) {
        UserEntity actor = userRepository.findByEmail(principal.getName()).orElseThrow();
        return ResponseEntity.ok(assignedTestService.assignTest(actor, req));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> unassignTest(Principal principal, @PathVariable Long id) {
        UserEntity actor = userRepository.findByEmail(principal.getName()).orElseThrow();
        assignedTestService.unassignTest(actor, id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/complete")
    @Transactional
    public ResponseEntity<AssignedTestDtos.AssignedTestResponse> markAsCompleted(Principal principal, @PathVariable Long id) {
        UserEntity user = userRepository.findByEmail(principal.getName()).orElseThrow();
        return ResponseEntity.ok(assignedTestService.markAsCompleted(user, id));
    }
}
