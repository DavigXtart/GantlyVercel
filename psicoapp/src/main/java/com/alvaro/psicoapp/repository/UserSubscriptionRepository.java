package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.UserSubscriptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscriptionEntity, Long> {
    Optional<UserSubscriptionEntity> findByStripeSubscriptionId(String stripeSubscriptionId);
    Optional<UserSubscriptionEntity> findByUserIdAndStatus(Long userId, String status);
}
