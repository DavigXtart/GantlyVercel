package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.AssignedTestEntity;
import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.TestEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.AssignedTestDtos;
import com.alvaro.psicoapp.repository.AssignedTestRepository;
import com.alvaro.psicoapp.repository.TestRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AssignedTestService {
    private final AssignedTestRepository assignedTestRepository;
    private final UserRepository userRepository;
    private final TestRepository testRepository;

    public AssignedTestService(AssignedTestRepository assignedTestRepository, UserRepository userRepository, TestRepository testRepository) {
        this.assignedTestRepository = assignedTestRepository;
        this.userRepository = userRepository;
        this.testRepository = testRepository;
    }

    @Transactional(readOnly = true)
    public List<AssignedTestDtos.AssignedTestDto> myAssignedTests(UserEntity user) {
        if (user == null) return Collections.emptyList();
        List<AssignedTestEntity> assignedTests;
        if (RoleConstants.PSYCHOLOGIST.equals(user.getRole())) {
            assignedTests = assignedTestRepository.findByPsychologist_IdOrderByAssignedAtDesc(user.getId());
        } else {
            assignedTests = assignedTestRepository.findByUser_IdAndCompletedAtIsNullOrderByAssignedAtDesc(user.getId());
        }
        if (assignedTests == null || assignedTests.isEmpty()) return Collections.emptyList();
        return assignedTests.stream().map(this::toDto).filter(Optional::isPresent).map(Optional::get).collect(Collectors.toList());
    }

    @Transactional
    public AssignedTestDtos.AssignedTestResponse assignTest(UserEntity actor, AssignedTestDtos.AssignTestRequest req) {
        if (!RoleConstants.PSYCHOLOGIST.equals(actor.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo los psicólogos pueden asignar tests");
        }
        UserEntity user = userRepository.findById(req.userId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        TestEntity test = testRepository.findById(req.testId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test no encontrado"));
        var existing = assignedTestRepository.findByUserAndTest(user, test);
        if (existing.isPresent()) {
            AssignedTestEntity existingAssigned = existing.get();
            return new AssignedTestDtos.AssignedTestResponse(
                    existingAssigned.getId(), user.getId(), test.getId(), actor.getId(),
                    existingAssigned.getAssignedAt(), existingAssigned.getCompletedAt());
        }
        AssignedTestEntity assigned = new AssignedTestEntity();
        assigned.setUser(user);
        assigned.setPsychologist(actor);
        assigned.setTest(test);
        assigned.setAssignedAt(Instant.now());
        AssignedTestEntity saved = assignedTestRepository.save(assigned);
        return new AssignedTestDtos.AssignedTestResponse(
                saved.getId(), user.getId(), test.getId(), actor.getId(),
                saved.getAssignedAt(), saved.getCompletedAt());
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
                saved.getId(), assigned.getUser().getId(), assigned.getTest().getId(), assigned.getPsychologist().getId(),
                assigned.getAssignedAt(), saved.getCompletedAt());
    }

    private Optional<AssignedTestDtos.AssignedTestDto> toDto(AssignedTestEntity at) {
        try {
            UserEntity userEntity = at.getUser();
            TestEntity testEntity = at.getTest();
            UserEntity psychEntity = at.getPsychologist();
            return Optional.of(new AssignedTestDtos.AssignedTestDto(
                    at.getId(),
                    userEntity != null ? userEntity.getId() : null,
                    userEntity != null ? (userEntity.getName() != null ? userEntity.getName() : "") : "",
                    userEntity != null ? (userEntity.getEmail() != null ? userEntity.getEmail() : "") : "",
                    userEntity != null ? userEntity.getAvatarUrl() : null,
                    testEntity != null ? testEntity.getId() : null,
                    testEntity != null ? (testEntity.getTitle() != null ? testEntity.getTitle() : "") : "",
                    testEntity != null ? (testEntity.getCode() != null ? testEntity.getCode() : "") : "",
                    testEntity != null ? new AssignedTestDtos.TestSummary(testEntity.getId(), testEntity.getTitle() != null ? testEntity.getTitle() : "", testEntity.getCode() != null ? testEntity.getCode() : "") : null,
                    psychEntity != null ? psychEntity.getId() : null,
                    psychEntity != null ? (psychEntity.getName() != null ? psychEntity.getName() : "") : "",
                    at.getAssignedAt() != null ? at.getAssignedAt().toString() : "",
                    at.getCompletedAt() != null ? at.getCompletedAt().toString() : null
            ));
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
