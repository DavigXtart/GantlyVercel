package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.TestResultEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.domain.TestEntity;
import com.alvaro.psicoapp.domain.SubfactorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TestResultRepository extends JpaRepository<TestResultEntity, Long> {
	List<TestResultEntity> findByUser(UserEntity user);
	List<TestResultEntity> findByUserAndTest(UserEntity user, TestEntity test);
	List<TestResultEntity> findByTest(TestEntity test);
	List<TestResultEntity> findBySubfactor(SubfactorEntity subfactor);
}

