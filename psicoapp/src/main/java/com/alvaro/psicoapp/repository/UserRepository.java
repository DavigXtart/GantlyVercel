package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
	Optional<UserEntity> findByEmail(String email);
	boolean existsByEmail(String email);
    List<UserEntity> findByRole(String role);
    List<UserEntity> findByRoleAndCreatedAtBefore(String role, Instant cutoff);
	Optional<UserEntity> findByVerificationToken(String token);
	Optional<UserEntity> findByPasswordResetToken(String token);
	Optional<UserEntity> findByOauth2ProviderAndOauth2ProviderId(String provider, String providerId);
	Optional<UserEntity> findByReferralCode(String referralCode);
	List<UserEntity> findByCompanyId(Long companyId);
}