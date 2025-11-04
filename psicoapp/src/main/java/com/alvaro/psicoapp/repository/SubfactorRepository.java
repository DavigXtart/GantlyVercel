package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.SubfactorEntity;
import com.alvaro.psicoapp.domain.TestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SubfactorRepository extends JpaRepository<SubfactorEntity, Long> {
	List<SubfactorEntity> findByTest(TestEntity test);
	List<SubfactorEntity> findByTestOrderByPositionAsc(TestEntity test);
	Optional<SubfactorEntity> findByTestAndCode(TestEntity test, String code);
	List<SubfactorEntity> findByFactorId(Long factorId);
}

