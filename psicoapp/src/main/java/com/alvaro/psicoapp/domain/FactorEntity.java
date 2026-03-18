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
	private String code;

	@Column(nullable = false, length = 100)
	private String name;

	@Column(columnDefinition = "TEXT")
	private String description;

	@Column(nullable = false)
	private Integer position;

	@Column(name = "min_label", length = 100)
	private String minLabel;

	@Column(name = "max_label", length = 100)
	private String maxLabel;

	@Column(length = 500)
	private String formula;

	@Column(nullable = false)
	private Boolean calculated = false;

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
	public String getMinLabel() { return minLabel; }
	public void setMinLabel(String minLabel) { this.minLabel = minLabel; }
	public String getMaxLabel() { return maxLabel; }
	public void setMaxLabel(String maxLabel) { this.maxLabel = maxLabel; }
	public String getFormula() { return formula; }
	public void setFormula(String formula) { this.formula = formula; }
	public Boolean getCalculated() { return calculated; }
	public void setCalculated(Boolean calculated) { this.calculated = calculated; }
	public List<SubfactorEntity> getSubfactors() { return subfactors; }
	public void setSubfactors(List<SubfactorEntity> subfactors) { this.subfactors = subfactors; }
}
