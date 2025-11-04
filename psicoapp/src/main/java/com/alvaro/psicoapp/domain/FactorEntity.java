package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "factors")
public class FactorEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "test_id")
	private TestEntity test;

	@Column(nullable = false, length = 50)
	private String code; // Ej: "EXTRAVERSION", "ANSIEDAD"

	@Column(nullable = false, length = 100)
	private String name; // Ej: "Extraversión", "Ansiedad"

	@Column(columnDefinition = "TEXT")
	private String description;

	@Column(nullable = false)
	private Integer position;

	@OneToMany(mappedBy = "factor", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<SubfactorEntity> subfactors = new ArrayList<>();

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
	public Integer getPosition() { return position; }
	public void setPosition(Integer position) { this.position = position; }
	public List<SubfactorEntity> getSubfactors() { return subfactors; }
	public void setSubfactors(List<SubfactorEntity> subfactors) { this.subfactors = subfactors; }
}

