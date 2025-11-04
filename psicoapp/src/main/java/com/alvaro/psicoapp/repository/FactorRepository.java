package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.FactorEntity;
import com.alvaro.psicoapp.domain.TestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FactorRepository extends JpaRepository<FactorEntity, Long> {
	List<FactorEntity> findByTest(TestEntity test);
	List<FactorEntity> findByTestOrderByPositionAsc(TestEntity test);
	Optional<FactorEntity> findByTestAndCode(TestEntity test, String code);
}

