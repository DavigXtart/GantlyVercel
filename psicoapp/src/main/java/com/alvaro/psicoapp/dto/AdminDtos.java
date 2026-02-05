package com.alvaro.psicoapp.dto;

import java.time.Instant;
import java.util.List;

public class AdminDtos {
    public static class TestCreate {
        public String code;
        public String title;
        public String description;
    }

    public static class TestUpdate {
        public String code;
        public String title;
        public String description;
        public Boolean active;
        public String category;
        public String topic;
    }

    public static class FactorCreate {
        public Long testId;
        public String code;
        public String name;
        public String description;
        public Integer position;
    }

    public static class SubfactorCreate {
        public Long testId;
        public String code;
        public String name;
        public String description;
        public Long factorId;
        public Integer position;
    }

    public static class QuestionCreate {
        public Long testId;
        public String text;
        public String type;
        public Integer position;
        public Long subfactorId;
        public java.util.List<AnswerOption> answers;
    }

    public static class AnswerOption {
        public String text;
        public Integer value;
        public Integer position;
    }

    public static class QuestionUpdate {
        public String text;
        public String type;
        public Integer position;
        public Long subfactorId;
    }

    public static class SetSubfactorReq {
        public Long subfactorId;
    }

    public static class AnswerCreate {
        public Long questionId;
        public String text;
        public Integer value;
        public Integer position;
    }

    public static class AnswerUpdate {
        public String text;
        public Integer value;
        public Integer position;
    }

    public static class EvaluationTestCreate {
        public String code;
        public String title;
        public String description;
        public String category;
        public String topic;
        public Boolean active = true;
    }

    public static class EvaluationTestUpdate {
        public String code;
        public String title;
        public String description;
        public String category;
        public String topic;
        public Boolean active;
    }

    // --- DTOs de respuesta ---

    public record SubfactorDto(Long id, String code, String name) {}
    public record FactorDto(Long id, String code, String name, List<SubfactorDto> subfactors) {}
    public record TestStructureResponse(List<FactorDto> factors) {}

    public record FactorCreateResponse(Long id, String code, String name, Long testId, Integer position) {}
    public record SubfactorCreateResponse(Long id, String code, String name, Long testId, Integer position, Long factorId) {}
    public record InitDefaultStructureResponse(boolean success, String message) {}

    public record QuestionDto(Long id, String text, String type, Integer position) {}
    public record QuestionCreateResponse(Long id, String text, String type, Integer position) {}

    public record AnswerDto(Long id, String text, Integer value, Integer position) {}

    public record UserListDto(Long id, String name, String email, String role, Instant createdAt,
                             int testsCompleted, Long psychologistId, String psychologistName) {}

    public record AnswerInfoDto(Long questionId, String questionText, Integer questionPosition, String questionType,
                                Long answerId, String answerText, Integer answerValue,
                                Double numericValue, String textValue, Instant createdAt) {}

    public record TestWithAnswersDto(Long testId, String testCode, String testTitle, List<AnswerInfoDto> answers) {}
    public record UserDetailDto(Long id, String name, String email, String role, Instant createdAt,
                               List<TestWithAnswersDto> tests) {}

    public record UserTestAnswersDto(Long userId, String userName, String userEmail, List<TestWithAnswersDto> tests) {}

    public record SetRoleRequest(Long userId, String role) {}

    public record AssignPsychologistRequest(Long userId, Long psychologistId) {}
    public record AssignPsychologistResponse(boolean success, Long userId, Long psychologistId) {}
    public record UnassignPsychologistResponse(boolean success, Long userId, boolean deleted) {}

    public record StatisticsDto(long totalUsers, long users, long psychologists, long admins,
                                long totalTests, long evaluationTests, long totalAppointments, long bookedAppointments,
                                long totalUserAnswers, long assignedRelations, long verifiedUsers) {}
}
