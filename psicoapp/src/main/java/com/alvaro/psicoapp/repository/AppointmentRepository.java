package com.alvaro.psicoapp.repository;

import com.alvaro.psicoapp.domain.AppointmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

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
        @Param("status") String status
    );

    @Query("SELECT a FROM AppointmentEntity a WHERE a.psychologist.id = :psychologistId AND a.user.id = :userId AND a.startTime >= :startTime AND (a.status = 'BOOKED' OR a.status = 'CONFIRMED') ORDER BY a.startTime ASC")
    List<AppointmentEntity> findByPsychologist_IdAndUser_IdAndStartTimeGreaterThanEqualAndStatusIn(
        @Param("psychologistId") Long psychologistId,
        @Param("userId") Long userId,
        @Param("startTime") Instant startTime
    );

    @Query("SELECT a FROM AppointmentEntity a WHERE a.status = :status AND a.paymentStatus = :paymentStatus AND a.paymentDeadline < :deadline")
    List<AppointmentEntity> findByStatusAndPaymentStatusAndPaymentDeadlineBefore(
        @Param("status") String status,
        @Param("paymentStatus") String paymentStatus,
        @Param("deadline") Instant deadline
    );

    @Query("SELECT a FROM AppointmentEntity a WHERE a.status = :status AND a.startTime >= :startTime AND a.startTime <= :endTime ORDER BY a.startTime ASC")
    List<AppointmentEntity> findByStatusAndStartTimeBetween(
        @Param("status") String status,
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime
    );

    @Query("SELECT a FROM AppointmentEntity a WHERE a.status = :status AND a.paymentStatus = :paymentStatus ORDER BY a.startTime ASC")
    List<AppointmentEntity> findByStatusAndPaymentStatus(
        @Param("status") String status,
        @Param("paymentStatus") String paymentStatus
    );

    @Query("SELECT a FROM AppointmentEntity a WHERE a.psychologist.id = :psychologistId AND a.user.id = :userId AND a.endTime < :now AND (a.status = 'CONFIRMED' OR a.status = 'BOOKED') ORDER BY a.endTime DESC")
    List<AppointmentEntity> findLastCompletedAppointment(
        @Param("psychologistId") Long psychologistId,
        @Param("userId") Long userId,
        @Param("now") Instant now
    );
}
