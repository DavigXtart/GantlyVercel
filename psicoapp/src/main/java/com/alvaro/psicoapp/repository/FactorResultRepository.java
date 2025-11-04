package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.FactorResultEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.domain.TestEntity;
import com.alvaro.psicoapp.domain.FactorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FactorResultRepository extends JpaRepository<FactorResultEntity, Long> {
	List<FactorResultEntity> findByUser(UserEntity user);
	List<FactorResultEntity> findByUserAndTest(UserEntity user, TestEntity test);
	List<FactorResultEntity> findByTest(TestEntity test);
	List<FactorResultEntity> findByFactor(FactorEntity factor);
}

