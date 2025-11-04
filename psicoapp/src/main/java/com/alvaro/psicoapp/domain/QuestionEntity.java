package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "questions")
public class QuestionEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "test_id")
	private TestEntity test;

	@Column(nullable = false, length = 500)
	private String text;

	@Column(nullable = false, length = 30)
	private String type; // SINGLE, MULTI, SCALE

	@Column(nullable = false)
	private Integer position;

	@ManyToOne
	@JoinColumn(name = "subfactor_id")
	private SubfactorEntity subfactor; // Subfactor al que pertenece esta pregunta

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public TestEntity getTest() { return test; }
	public void setTest(TestEntity test) { this.test = test; }
	public String getText() { return text; }
	public void setText(String text) { this.text = text; }
	public String getType() { return type; }
	public void setType(String type) { this.type = type; }
	public Integer getPosition() { return position; }
	public void setPosition(Integer position) { this.position = position; }
	public SubfactorEntity getSubfactor() { return subfactor; }
	public void setSubfactor(SubfactorEntity subfactor) { this.subfactor = subfactor; }
}