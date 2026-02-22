package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.ConsentDocumentTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConsentDocumentTypeRepository extends JpaRepository<ConsentDocumentTypeEntity, Long> {
    List<ConsentDocumentTypeEntity> findByActiveTrueOrderByTitleAsc();
    Optional<ConsentDocumentTypeEntity> findByCode(String code);
}
