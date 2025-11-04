package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "test_results")
public class TestResultEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "user_id")
	private UserEntity user;

	@ManyToOne(optional = false)
	@JoinColumn(name = "test_id")
	private TestEntity test;

	@ManyToOne(optional = false)
	@JoinColumn(name = "subfactor_id")
	private SubfactorEntity subfactor;

	@Column(nullable = false, columnDefinition = "DECIMAL(10,2)")
	private Double score; // Puntuación total obtenida

	@Column(nullable = false, columnDefinition = "DECIMAL(10,2)")
	private Double maxScore; // Puntuación máxima posible

	@Column(nullable = false, columnDefinition = "DECIMAL(5,2)")
	private Double percentage; // Porcentaje (score/maxScore * 100)

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public UserEntity getUser() { return user; }
	public void setUser(UserEntity user) { this.user = user; }
	public TestEntity getTest() { return test; }
	public void setTest(TestEntity test) { this.test = test; }
	public SubfactorEntity getSubfactor() { return subfactor; }
	public void setSubfactor(SubfactorEntity subfactor) { this.subfactor = subfactor; }
	public Double getScore() { return score; }
	public void setScore(Double score) { this.score = score; }
	public Double getMaxScore() { return maxScore; }
	public void setMaxScore(Double maxScore) { this.maxScore = maxScore; }
	public Double getPercentage() { return percentage; }
	public void setPercentage(Double percentage) { this.percentage = percentage; }
	public Instant getCreatedAt() { return createdAt; }
	public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

