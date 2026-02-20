package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.CompanyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<CompanyEntity, Long> {
    Optional<CompanyEntity> findByEmail(String email);
    Optional<CompanyEntity> findByReferralCode(String referralCode);
    boolean existsByEmail(String email);
    boolean existsByReferralCode(String referralCode);
}
