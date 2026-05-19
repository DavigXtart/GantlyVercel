package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.WaitingListEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WaitingListRepository extends JpaRepository<WaitingListEntity, Long> {
    List<WaitingListEntity> findByCompanyIdAndStatusOrderByCreatedAtAsc(Long companyId, String status);
    List<WaitingListEntity> findByCompanyIdOrderByCreatedAtDesc(Long companyId);
    Optional<WaitingListEntity> findByIdAndCompanyId(Long id, Long companyId);
}
