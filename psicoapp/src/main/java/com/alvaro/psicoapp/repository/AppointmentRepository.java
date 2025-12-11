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
    
    
    // Obtener todas las citas reservadas por el usuario
    @Query("SELECT a FROM AppointmentEntity a WHERE a.user.id = :userId AND a.status = 'BOOKED' ORDER BY a.startTime ASC")
    List<AppointmentEntity> findBookedByUser_IdOrderByStartTimeAsc(@Param("userId") Long userId);
    
    // Buscar citas activas entre psicólogo y usuario
    @Query("SELECT a FROM AppointmentEntity a WHERE a.psychologist.id = :psychologistId AND a.user.id = :userId AND a.startTime >= :startTime AND a.status = :status ORDER BY a.startTime ASC")
    List<AppointmentEntity> findByPsychologist_IdAndUser_IdAndStartTimeGreaterThanEqualAndStatus(
        @Param("psychologistId") Long psychologistId, 
        @Param("userId") Long userId, 
        @Param("startTime") Instant startTime, 
        @Param("status") String status
    );
    
    // Buscar citas con pagos expirados
    @Query("SELECT a FROM AppointmentEntity a WHERE a.status = :status AND a.paymentStatus = :paymentStatus AND a.paymentDeadline < :deadline")
    List<AppointmentEntity> findByStatusAndPaymentStatusAndPaymentDeadlineBefore(
        @Param("status") String status,
        @Param("paymentStatus") String paymentStatus,
        @Param("deadline") Instant deadline
    );
    
    // Buscar citas por estado y rango de fechas
    @Query("SELECT a FROM AppointmentEntity a WHERE a.status = :status AND a.startTime >= :startTime AND a.startTime <= :endTime ORDER BY a.startTime ASC")
    List<AppointmentEntity> findByStatusAndStartTimeBetween(
        @Param("status") String status,
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime
    );
    
    // Buscar citas por estado y estado de pago
    @Query("SELECT a FROM AppointmentEntity a WHERE a.status = :status AND a.paymentStatus = :paymentStatus ORDER BY a.startTime ASC")
    List<AppointmentEntity> findByStatusAndPaymentStatus(
        @Param("status") String status,
        @Param("paymentStatus") String paymentStatus
    );
}


