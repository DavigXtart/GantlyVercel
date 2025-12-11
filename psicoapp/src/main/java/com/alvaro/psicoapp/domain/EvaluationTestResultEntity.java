package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "evaluation_test_results")
public class EvaluationTestResultEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "test_id")
    private EvaluationTestEntity test;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @Column(precision = 10, scale = 2)
    private BigDecimal score;

    @Column(length = 50)
    private String level; // 'Bajo', 'Moderado', 'Alto', etc.

    @Column(columnDefinition = "TEXT")
    private String answers; // JSON con las respuestas

    @Column(name = "completed_at", nullable = false, updatable = false)
    private Instant completedAt = Instant.now();

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }
    public EvaluationTestEntity getTest() { return test; }
    public void setTest(EvaluationTestEntity test) { this.test = test; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public String getAnswers() { return answers; }
    public void setAnswers(String answers) { this.answers = answers; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}

