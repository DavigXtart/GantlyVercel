package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "answers")
public class AnswerEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "question_id")
	private QuestionEntity question;

	@Column(nullable = false, length = 500)
	private String text;

	private Integer value;

	@Column(nullable = false)
	private Integer position;

	@Column(name = "is_correct")
	private Boolean isCorrect = false;

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public QuestionEntity getQuestion() { return question; }
	public void setQuestion(QuestionEntity question) { this.question = question; }
	public String getText() { return text; }
	public void setText(String text) { this.text = text; }
	public Integer getValue() { return value; }
	public void setValue(Integer value) { this.value = value; }
	public Integer getPosition() { return position; }
	public void setPosition(Integer position) { this.position = position; }
	public Boolean getIsCorrect() { return isCorrect; }
	public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }
}