package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.NotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {
    List<NotificationEntity> findByUser_IdAndReadFalseOrderByCreatedAtDesc(Long userId);

    List<NotificationEntity> findByUser_IdOrderByCreatedAtDesc(Long userId);

    long countByUser_IdAndReadFalse(Long userId);

    @Modifying
    @Query("UPDATE NotificationEntity n SET n.read = true WHERE n.user.id = :userId AND n.read = false")
    void markAllAsRead(Long userId);

    void deleteByUser_Id(Long userId);

    @Modifying
    @Query("DELETE FROM NotificationEntity n WHERE n.createdAt < :cutoff")
    int deleteByCreatedAtBefore(@Param("cutoff") Instant cutoff);
}
