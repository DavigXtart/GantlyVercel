package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.TestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TestRepository extends JpaRepository<TestEntity, Long> {
	Optional<TestEntity> findByCode(String code);

	List<TestEntity> findByActiveTrueAndCategory(String category);

	List<TestEntity> findByActiveTrueAndCategoryAndTopic(String category, String topic);
}
