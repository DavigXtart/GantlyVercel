package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

	/**
	 * Filter by role only. Text search on encrypted PII fields (name, email) must
	 * be performed in the service layer after decryption.
	 */
	@Query("SELECT u FROM UserEntity u WHERE " +
		   "(:role IS NULL OR :role = '' OR u.role = :role)")
	Page<UserEntity> findAllByRole(@Param("role") String role,
								   Pageable pageable);

	/**
	 * @deprecated LIKE search on encrypted columns is not possible. Use
	 * {@link #findAllByRole} + service-layer text filtering instead.
	 * Kept temporarily so callers that pass empty search still compile.
	 */
	@Deprecated
	@Query("SELECT u FROM UserEntity u WHERE " +
		   "(:role IS NULL OR :role = '' OR u.role = :role)")
	Page<UserEntity> findAllWithFilters(@Param("search") String search,
										@Param("role") String role,
										Pageable pageable);
}
