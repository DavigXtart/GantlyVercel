package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "user_answers")
public class UserAnswerEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	@ManyToOne(optional = false) @JoinColumn(name = "user_id") private UserEntity user;
	@ManyToOne(optional = false) @JoinColumn(name = "question_id") private QuestionEntity question;
	@ManyToOne @JoinColumn(name = "answer_id") private AnswerEntity answer;
	private Double numericValue;
	@Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
	public Long getId() { return id; } public void setId(Long id) { this.id = id; }
	public UserEntity getUser() { return user; } public void setUser(UserEntity user) { this.user = user; }
	public QuestionEntity getQuestion() { return question; } public void setQuestion(QuestionEntity question) { this.question = question; }
	public AnswerEntity getAnswer() { return answer; } public void setAnswer(AnswerEntity answer) { this.answer = answer; }
	public Double getNumericValue() { return numericValue; } public void setNumericValue(Double numericValue) { this.numericValue = numericValue; }
	public Instant getCreatedAt() { return createdAt; } public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}