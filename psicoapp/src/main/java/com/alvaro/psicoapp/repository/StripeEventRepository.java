package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.StripeEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StripeEventRepository extends JpaRepository<StripeEventEntity, String> {
}
