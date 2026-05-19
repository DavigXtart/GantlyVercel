package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.AppointmentEntity;
import com.alvaro.psicoapp.domain.AppointmentStatusEnum;
import com.alvaro.psicoapp.domain.PaymentStatusEnum;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<AppointmentEntity, Long> {
    List<AppointmentEntity> findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(Long psychologistId, Instant from, Instant to);
    List<AppointmentEntity> findByUser_IdOrderByStartTimeAsc(Long userId);
    long deleteByUser_Id(Long userId);

    @Query("SELECT a FROM AppointmentEntity a WHERE a.user.id = :userId AND a.status = 'BOOKED' ORDER BY a.startTime ASC")
    List<AppointmentEntity> findBookedByUser_IdOrderByStartTimeAsc(@Param("userId") Long userId);

    @Query("SELECT a FROM AppointmentEntity a WHERE a.psychologist.id = :psychologistId AND a.user.id = :userId AND a.startTime >= :startTime AND a.status = :status ORDER BY a.startTime ASC")
    List<AppointmentEntity> findByPsychologist_IdAndUser_IdAndStartTimeGreaterThanEqualAndStatus(
        @Param("psychologistId") Long psychologistId,
        @Param("userId") Long userId,
        @Param("startTime") Instant startTime,
        @Param("status") AppointmentStatusEnum status
    );

    @Query("SELECT a FROM AppointmentEntity a WHERE a.psychologist.id = :psychologistId AND a.user.id = :userId AND a.startTime >= :startTime AND (a.status = 'BOOKED' OR a.status = 'CONFIRMED') ORDER BY a.startTime ASC")
    List<AppointmentEntity> findByPsychologist_IdAndUser_IdAndStartTimeGreaterThanEqualAndStatusIn(
        @Param("psychologistId") Long psychologistId,
        @Param("userId") Long userId,
        @Param("startTime") Instant startTime
    );

    @Query("SELECT a FROM AppointmentEntity a WHERE a.status = :status AND a.paymentStatus = :paymentStatus AND a.paymentDeadline < :deadline")
    List<AppointmentEntity> findByStatusAndPaymentStatusAndPaymentDeadlineBefore(
        @Param("status") AppointmentStatusEnum status,
        @Param("paymentStatus") PaymentStatusEnum paymentStatus,
        @Param("deadline") Instant deadline
    );

    @Query("SELECT a FROM AppointmentEntity a WHERE a.status = :status AND a.startTime >= :startTime AND a.startTime <= :endTime ORDER BY a.startTime ASC")
    List<AppointmentEntity> findByStatusAndStartTimeBetween(
        @Param("status") AppointmentStatusEnum status,
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime
    );

    @Query("SELECT a FROM AppointmentEntity a WHERE a.status = :status AND a.paymentStatus = :paymentStatus ORDER BY a.startTime ASC")
    List<AppointmentEntity> findByStatusAndPaymentStatus(
        @Param("status") AppointmentStatusEnum status,
        @Param("paymentStatus") PaymentStatusEnum paymentStatus
    );

    @Query("SELECT a FROM AppointmentEntity a WHERE a.psychologist.id = :psychologistId AND a.user.id = :userId AND a.endTime < :now AND (a.status = 'CONFIRMED' OR a.status = 'BOOKED') ORDER BY a.endTime DESC")
    List<AppointmentEntity> findLastCompletedAppointment(
        @Param("psychologistId") Long psychologistId,
        @Param("userId") Long userId,
        @Param("now") Instant now
    );

    List<AppointmentEntity> findByStartTimeBetweenAndStatus(Instant from, Instant to, AppointmentStatusEnum status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM AppointmentEntity a WHERE a.id = :id")
    Optional<AppointmentEntity> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT COUNT(a) > 0 FROM AppointmentEntity a WHERE a.psychologist.id = :psychologistId " +
           "AND a.startTime = :startTime AND a.status IN ('BOOKED', 'CONFIRMED')")
    boolean existsActiveAppointment(@Param("psychologistId") Long psychologistId,
                                    @Param("startTime") Instant startTime);

    @Query("SELECT a FROM AppointmentEntity a WHERE a.status IN ('CONFIRMED', 'BOOKED') " +
           "AND a.paymentStatus = 'PENDING' AND a.paymentDeadline IS NULL AND a.createdAt < :cutoff")
    List<AppointmentEntity> findExpiredUnpaidWithoutDeadline(@Param("cutoff") Instant cutoff);

    List<AppointmentEntity> findByRecurrenceGroupId(String recurrenceGroupId);

    @Query("SELECT a FROM AppointmentEntity a WHERE a.psychologist.id = :psychologistId " +
           "AND a.user IS NOT NULL " +
           "AND (a.status = 'CONFIRMED' OR a.status = 'BOOKED') " +
           "AND a.startTime BETWEEN :fromTime AND :toTime")
    Page<AppointmentEntity> findBillingAppointments(
        @Param("psychologistId") Long psychologistId,
        @Param("fromTime") Instant fromTime,
        @Param("toTime") Instant toTime,
        Pageable pageable);
}
