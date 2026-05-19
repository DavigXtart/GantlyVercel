package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.AssignedTestEntity;
import com.alvaro.psicoapp.domain.EvaluationTestEntity;
import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.TestEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.AssignedTestDtos;
import com.alvaro.psicoapp.repository.AssignedTestRepository;
import com.alvaro.psicoapp.repository.EvaluationTestRepository;
import com.alvaro.psicoapp.repository.TestRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AssignedTestService {
    private static final Logger log = LoggerFactory.getLogger(AssignedTestService.class);
    private final AssignedTestRepository assignedTestRepository;
    private final UserRepository userRepository;
    private final TestRepository testRepository;
    private final EvaluationTestRepository evaluationTestRepository;

    public AssignedTestService(AssignedTestRepository assignedTestRepository, UserRepository userRepository, TestRepository testRepository, EvaluationTestRepository evaluationTestRepository) {
        this.assignedTestRepository = assignedTestRepository;
        this.userRepository = userRepository;
        this.testRepository = testRepository;
        this.evaluationTestRepository = evaluationTestRepository;
    }

    @Transactional(readOnly = true)
    public List<AssignedTestDtos.AssignedTestDto> myAssignedTests(UserEntity user) {
        if (user == null) return Collections.emptyList();
        List<AssignedTestEntity> assignedTests;
        if (RoleConstants.PSYCHOLOGIST.equals(user.getRole())) {
            assignedTests = assignedTestRepository.findByPsychologistIdWithRelations(user.getId());
        } else {
            assignedTests = assignedTestRepository.findByUserIdWithRelations(user.getId());
        }
        if (assignedTests == null || assignedTests.isEmpty()) return Collections.emptyList();
        return assignedTests.stream().map(this::toDto).filter(Optional::isPresent).map(Optional::get).collect(Collectors.toList());
    }

    @Transactional
    public AssignedTestDtos.AssignedTestResponse assignTest(UserEntity actor, AssignedTestDtos.AssignTestRequest req) {
        if (!RoleConstants.PSYCHOLOGIST.equals(actor.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo los psicólogos pueden asignar tests");
        }
        if (req.testId() == null && req.evaluationTestId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe especificar testId o evaluationTestId");
        }
        UserEntity user = userRepository.findById(req.userId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        TestEntity test = null;
        EvaluationTestEntity evalTest = null;

        if (req.testId() != null) {
            test = testRepository.findById(req.testId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test no encontrado"));
            var existing = assignedTestRepository.findByUserAndTest(user, test);
            if (existing.isPresent()) {
                AssignedTestEntity e = existing.get();
                return new AssignedTestDtos.AssignedTestResponse(e.getId(), user.getId(), test.getId(), null, actor.getId(), e.getAssignedAt(), e.getCompletedAt());
            }
        } else {
            evalTest = evaluationTestRepository.findById(req.evaluationTestId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test clínico no encontrado"));
            var existing = assignedTestRepository.findByUser_IdAndEvaluationTest_Id(user.getId(), evalTest.getId());
            if (existing.isPresent()) {
                AssignedTestEntity e = existing.get();
                return new AssignedTestDtos.AssignedTestResponse(e.getId(), user.getId(), null, evalTest.getId(), actor.getId(), e.getAssignedAt(), e.getCompletedAt());
            }
        }

        AssignedTestEntity assigned = new AssignedTestEntity();
        assigned.setUser(user);
        assigned.setPsychologist(actor);
        assigned.setTest(test);
        assigned.setEvaluationTest(evalTest);
        assigned.setAssignedAt(Instant.now());
        AssignedTestEntity saved = assignedTestRepository.save(assigned);
        return new AssignedTestDtos.AssignedTestResponse(
                saved.getId(), user.getId(),
                test != null ? test.getId() : null,
                evalTest != null ? evalTest.getId() : null,
                actor.getId(), saved.getAssignedAt(), saved.getCompletedAt());
    }

    @Transactional
    public void unassignTest(UserEntity actor, Long id) {
        AssignedTestEntity assigned = assignedTestRepository.findById(id).orElseThrow();
        if (!RoleConstants.PSYCHOLOGIST.equals(actor.getRole()) || !assigned.getPsychologist().getId().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        assignedTestRepository.delete(assigned);
    }

    @Transactional
    public AssignedTestDtos.AssignedTestResponse markAsCompleted(UserEntity user, Long id) {
        AssignedTestEntity assigned = assignedTestRepository.findById(id).orElseThrow();
        if (!assigned.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        assigned.setCompletedAt(Instant.now());
        AssignedTestEntity saved = assignedTestRepository.save(assigned);
        return new AssignedTestDtos.AssignedTestResponse(
                saved.getId(), assigned.getUser().getId(),
                assigned.getTest() != null ? assigned.getTest().getId() : null,
                assigned.getEvaluationTest() != null ? assigned.getEvaluationTest().getId() : null,
                assigned.getPsychologist().getId(),
                assigned.getAssignedAt(), saved.getCompletedAt());
    }

    private Optional<AssignedTestDtos.AssignedTestDto> toDto(AssignedTestEntity at) {
        try {
            UserEntity userEntity = at.getUser();
            TestEntity testEntity = at.getTest();
            EvaluationTestEntity evalTest = at.getEvaluationTest();
            UserEntity psychEntity = at.getPsychologist();

            Long testId = testEntity != null ? testEntity.getId() : null;
            String testTitle = testEntity != null ? (testEntity.getTitle() != null ? testEntity.getTitle() : "") : (evalTest != null ? evalTest.getTitle() : "");
            String testCode = testEntity != null ? (testEntity.getCode() != null ? testEntity.getCode() : "") : (evalTest != null ? evalTest.getCode() : "");

            return Optional.of(new AssignedTestDtos.AssignedTestDto(
                    at.getId(),
                    userEntity != null ? userEntity.getId() : null,
                    userEntity != null ? (userEntity.getName() != null ? userEntity.getName() : "") : "",
                    userEntity != null ? (userEntity.getEmail() != null ? userEntity.getEmail() : "") : "",
                    userEntity != null ? userEntity.getAvatarUrl() : null,
                    testId,
                    testTitle,
                    testCode,
                    evalTest != null ? evalTest.getId() : null,
                    evalTest != null ? evalTest.getTitle() : null,
                    evalTest != null ? evalTest.getCode() : null,
                    testEntity != null ? new AssignedTestDtos.TestSummary(testEntity.getId(), testEntity.getTitle() != null ? testEntity.getTitle() : "", testEntity.getCode() != null ? testEntity.getCode() : "") : null,
                    psychEntity != null ? psychEntity.getId() : null,
                    psychEntity != null ? (psychEntity.getName() != null ? psychEntity.getName() : "") : "",
                    at.getAssignedAt() != null ? at.getAssignedAt().toString() : "",
                    at.getCompletedAt() != null ? at.getCompletedAt().toString() : null
            ));
        } catch (Exception e) {
            log.error("Error mapping AssignedTestEntity id={} to DTO: {}", at.getId(), e.getMessage(), e);
            return Optional.empty();
        }
    }
}
