package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "user_answers", indexes = {
    @Index(name = "idx_ua_user", columnList = "user_id"),
    @Index(name = "idx_ua_question", columnList = "question_id")
})
public class UserAnswerEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id") private UserEntity user;
	@ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "question_id") private QuestionEntity question;
	@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "answer_id") private AnswerEntity answer;
	private Double numericValue;
	@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "session_id") private TemporarySessionEntity session;
	@Column(name = "text_value", length = 1000) private String textValue;
	@Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
	public Long getId() { return id; } public void setId(Long id) { this.id = id; }
	public UserEntity getUser() { return user; } public void setUser(UserEntity user) { this.user = user; }
	public QuestionEntity getQuestion() { return question; } public void setQuestion(QuestionEntity question) { this.question = question; }
	public AnswerEntity getAnswer() { return answer; } public void setAnswer(AnswerEntity answer) { this.answer = answer; }
	public Double getNumericValue() { return numericValue; } public void setNumericValue(Double numericValue) { this.numericValue = numericValue; }
	public Instant getCreatedAt() { return createdAt; } public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
	public TemporarySessionEntity getSession() { return session; } public void setSession(TemporarySessionEntity session) { this.session = session; }
	public String getTextValue() { return textValue; } public void setTextValue(String textValue) { this.textValue = textValue; }
}
