package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "subfactors")
public class SubfactorEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "test_id")
	private TestEntity test;

	@Column(nullable = false, length = 10)
	private String code; // Ej: "A", "C", "Q4"

	@Column(nullable = false, length = 100)
	private String name; // Ej: "Afabilidad", "Tensión"

	@Column(columnDefinition = "TEXT")
	private String description;

	@ManyToOne
	@JoinColumn(name = "factor_id")
	private FactorEntity factor; // Factor general al que pertenece

	@Column(nullable = false)
	private Integer position;

	@OneToMany(mappedBy = "subfactor", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<QuestionEntity> questions = new ArrayList<>();

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public TestEntity getTest() { return test; }
	public void setTest(TestEntity test) { this.test = test; }
	public String getCode() { return code; }
	public void setCode(String code) { this.code = code; }
	public String getName() { return name; }
	public void setName(String name) { this.name = name; }
	public String getDescription() { return description; }
	public void setDescription(String description) { this.description = description; }
	public FactorEntity getFactor() { return factor; }
	public void setFactor(FactorEntity factor) { this.factor = factor; }
	public Integer getPosition() { return position; }
	public void setPosition(Integer position) { this.position = position; }
	public List<QuestionEntity> getQuestions() { return questions; }
	public void setQuestions(List<QuestionEntity> questions) { this.questions = questions; }
}

