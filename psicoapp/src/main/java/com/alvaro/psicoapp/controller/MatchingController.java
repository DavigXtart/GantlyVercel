package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.dto.MatchingDtos;
import com.alvaro.psicoapp.service.CurrentUserService;
import com.alvaro.psicoapp.service.MatchingService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/matching")
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
    public ResponseEntity<?> getPatientMatchingTest(Principal principal) {
        return ResponseEntity.ok(matchingService.getMatchingTest(PATIENT_MATCHING_TEST_CODE));
    }

    @GetMapping("/psychologist-test")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getPsychologistMatchingTest(Principal principal) {
        var user = currentUserService.getCurrentUser(principal);
        if (!RoleConstants.PSYCHOLOGIST.equals(user.getRole())) {
            return ResponseEntity.status(403).body(new MatchingDtos.MatchingErrorResponse("Solo psicólogos pueden acceder a este test"));
        }
        return ResponseEntity.ok(matchingService.getMatchingTest(PSYCHOLOGIST_MATCHING_TEST_CODE));
    }

    @PostMapping("/patient-test/submit")
    @Transactional
    public ResponseEntity<MatchingDtos.MatchingMessageResponse> submitPatientMatchingTest(Principal principal, @RequestBody MatchingDtos.SubmitMatchingRequest req) {
        var user = currentUserService.getCurrentUser(principal);
        matchingService.saveMatchingTestAnswers(user, PATIENT_MATCHING_TEST_CODE, req);
        return ResponseEntity.ok(new MatchingDtos.MatchingMessageResponse(true, "Test de matching completado"));
    }

    @PostMapping("/psychologist-test/submit")
    @Transactional
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
    public ResponseEntity<?> getMatchingPsychologists(Principal principal) {
        var patient = currentUserService.getCurrentUser(principal);
        return ResponseEntity.ok(matchingService.getMatchingPsychologistsWithRatings(patient.getId()));
    }

    @GetMapping("/psychologist-test/status")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getPsychologistMatchingTestStatus(Principal principal) {
        var user = currentUserService.getCurrentUser(principal);
        if (!RoleConstants.PSYCHOLOGIST.equals(user.getRole())) {
            return ResponseEntity.status(403).body(new MatchingDtos.MatchingErrorResponse("Solo psicólogos pueden acceder a este endpoint"));
        }
        return ResponseEntity.ok(Map.of("completed", matchingService.getPsychologistMatchingTestStatus(user)));
    }
}
