package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.config.AppTimezone;
import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.dto.WeeklyScheduleDtos;
import com.alvaro.psicoapp.dto.WeeklyScheduleDtos.DayScheduleDto;
import com.alvaro.psicoapp.dto.WeeklyScheduleDtos.GenerateResult;
import com.alvaro.psicoapp.repository.AppointmentRepository;
import com.alvaro.psicoapp.repository.PsychAbsenceRepository;
import com.alvaro.psicoapp.repository.PsychologistProfileRepository;
import com.alvaro.psicoapp.repository.WeeklyScheduleRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WeeklyScheduleService {
    private static final Logger logger = LoggerFactory.getLogger(WeeklyScheduleService.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private final WeeklyScheduleRepository weeklyScheduleRepository;
    private final AppointmentRepository appointmentRepository;
    private final PsychAbsenceRepository psychAbsenceRepository;
    private final PsychologistProfileRepository psychologistProfileRepository;

    public WeeklyScheduleService(WeeklyScheduleRepository weeklyScheduleRepository,
                                  AppointmentRepository appointmentRepository,
                                  PsychAbsenceRepository psychAbsenceRepository,
                                  PsychologistProfileRepository psychologistProfileRepository) {
        this.weeklyScheduleRepository = weeklyScheduleRepository;
        this.appointmentRepository = appointmentRepository;
        this.psychAbsenceRepository = psychAbsenceRepository;
        this.psychologistProfileRepository = psychologistProfileRepository;
    }

    @Transactional(readOnly = true)
    public List<DayScheduleDto> getSchedule(Long psychologistId) {
        return weeklyScheduleRepository.findByPsychologist_IdOrderByDayOfWeekAsc(psychologistId)
                .stream()
                .map(e -> new DayScheduleDto(
                        e.getDayOfWeek(),
                        Boolean.TRUE.equals(e.getEnabled()),
                        e.getStartTime1(),
                        e.getEndTime1(),
                        e.getStartTime2(),
                        e.getEndTime2()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public void saveSchedule(UserEntity psychologist, List<DayScheduleDto> days) {
        // Validate each day
        for (DayScheduleDto day : days) {
            if (day.dayOfWeek() < 0 || day.dayOfWeek() > 6) {
                throw new IllegalArgumentException("dayOfWeek debe estar entre 0 (Lunes) y 6 (Domingo)");
            }
            if (day.enabled()) {
                validateTimeBlock(day.startTime1(), day.endTime1(), "Bloque 1");
                if (day.startTime2() != null && day.endTime2() != null) {
                    validateTimeBlock(day.startTime2(), day.endTime2(), "Bloque 2");
                    LocalTime end1 = LocalTime.parse(day.endTime1());
                    LocalTime start2 = LocalTime.parse(day.startTime2());
                    if (start2.isBefore(end1)) {
                        throw new IllegalArgumentException(
                                "El inicio del bloque 2 (" + day.startTime2() + ") debe ser igual o posterior al fin del bloque 1 (" + day.endTime1() + ")");
                    }
                } else if ((day.startTime2() == null) != (day.endTime2() == null)) {
                    throw new IllegalArgumentException("Si se define un bloque 2, tanto startTime2 como endTime2 son obligatorios");
                }
            }
        }

        // Delete existing and insert new
        weeklyScheduleRepository.deleteByPsychologist_Id(psychologist.getId());
        weeklyScheduleRepository.flush();

        for (DayScheduleDto day : days) {
            WeeklyScheduleEntity entity = new WeeklyScheduleEntity();
            entity.setPsychologist(psychologist);
            entity.setDayOfWeek(day.dayOfWeek());
            entity.setEnabled(day.enabled());
            entity.setStartTime1(day.startTime1() != null ? day.startTime1() : "09:00");
            entity.setEndTime1(day.endTime1() != null ? day.endTime1() : "14:00");
            entity.setStartTime2(day.startTime2());
            entity.setEndTime2(day.endTime2());
            entity.setCreatedAt(Instant.now());
            entity.setUpdatedAt(Instant.now());
            weeklyScheduleRepository.save(entity);
        }

        logger.info("Weekly schedule saved for psychologist {}: {} days", psychologist.getId(), days.size());
    }

    @Transactional
    public GenerateResult generateSlots(Long psychologistId, int weeksAhead) {
        List<WeeklyScheduleEntity> schedule = weeklyScheduleRepository.findByPsychologist_IdAndEnabledTrue(psychologistId);
        if (schedule.isEmpty()) {
            logger.info("No enabled schedule found for psychologist {}", psychologistId);
            return new GenerateResult(0, 0);
        }

        // Get session price from psychologist profile
        BigDecimal sessionPrice = getSessionPrice(psychologistId);
        if (sessionPrice == null || sessionPrice.compareTo(BigDecimal.ZERO) <= 0) {
            logger.warn("No valid session price found for psychologist {}, using 0", psychologistId);
            sessionPrice = BigDecimal.ZERO;
        }

        // Get the psychologist UserEntity from one of the schedule entries
        UserEntity psychologist = schedule.get(0).getPsychologist();

        ZonedDateTime now = ZonedDateTime.now(AppTimezone.APP_ZONE);
        LocalDate startDate = now.toLocalDate();
        // If it's past midday, start from tomorrow to avoid creating slots in the past today
        if (now.getHour() >= 12) {
            startDate = startDate.plusDays(1);
        }
        LocalDate endDate = startDate.plusWeeks(weeksAhead);

        int created = 0;
        int skipped = 0;

        for (LocalDate date = startDate; date.isBefore(endDate); date = date.plusDays(1)) {
            // Java DayOfWeek: MONDAY=1...SUNDAY=7 → convert to 0=Monday...6=Sunday
            int dayOfWeek = date.getDayOfWeek().getValue() - 1;

            for (WeeklyScheduleEntity entry : schedule) {
                if (!entry.getDayOfWeek().equals(dayOfWeek)) continue;

                // Process block 1
                var result1 = generateSlotsForBlock(psychologist, date, entry.getStartTime1(), entry.getEndTime1(), sessionPrice, now);
                created += result1[0];
                skipped += result1[1];

                // Process block 2 if present
                if (entry.getStartTime2() != null && entry.getEndTime2() != null) {
                    var result2 = generateSlotsForBlock(psychologist, date, entry.getStartTime2(), entry.getEndTime2(), sessionPrice, now);
                    created += result2[0];
                    skipped += result2[1];
                }
            }
        }

        logger.info("Generated slots for psychologist {}: {} created, {} skipped", psychologistId, created, skipped);
        return new GenerateResult(created, skipped);
    }

    private int[] generateSlotsForBlock(UserEntity psychologist, LocalDate date, String startTimeStr, String endTimeStr,
                                         BigDecimal price, ZonedDateTime now) {
        int created = 0;
        int skipped = 0;

        LocalTime blockStart = LocalTime.parse(startTimeStr);
        LocalTime blockEnd = LocalTime.parse(endTimeStr);

        LocalTime slotStart = blockStart;
        while (slotStart.plusHours(1).compareTo(blockEnd) <= 0) {
            LocalTime slotEnd = slotStart.plusHours(1);

            ZonedDateTime startZdt = ZonedDateTime.of(date, slotStart, AppTimezone.APP_ZONE);
            ZonedDateTime endZdt = ZonedDateTime.of(date, slotEnd, AppTimezone.APP_ZONE);

            Instant startInstant = startZdt.toInstant();
            Instant endInstant = endZdt.toInstant();

            // Skip if slot is in the past
            if (startZdt.isBefore(now)) {
                skipped++;
                slotStart = slotEnd;
                continue;
            }

            // Check for existing appointment at this time (any status)
            boolean appointmentExists = hasExistingAppointment(psychologist.getId(), startInstant, endInstant);
            if (appointmentExists) {
                skipped++;
                slotStart = slotEnd;
                continue;
            }

            // Check for absences overlapping this slot
            boolean absenceExists = hasAbsenceOverlap(psychologist.getId(), startInstant, endInstant);
            if (absenceExists) {
                skipped++;
                slotStart = slotEnd;
                continue;
            }

            // Create the FREE appointment slot
            AppointmentEntity appointment = new AppointmentEntity();
            appointment.setPsychologist(psychologist);
            appointment.setStartTime(startInstant);
            appointment.setEndTime(endInstant);
            appointment.setStatus(AppointmentStatusEnum.FREE);
            appointment.setPrice(price);
            // Tax: default exempt (sanitary service)
            appointment.setTaxExempt(true);
            appointment.setTaxRate(BigDecimal.ZERO);
            appointment.setTaxAmount(BigDecimal.ZERO);
            appointment.setTotalAmount(price);

            appointmentRepository.save(appointment);
            created++;

            slotStart = slotEnd;
        }

        return new int[]{created, skipped};
    }

    private boolean hasExistingAppointment(Long psychologistId, Instant start, Instant end) {
        // Find appointments that overlap with [start, end)
        // An existing appointment overlaps if its start < end AND its end > start
        List<AppointmentEntity> existing = appointmentRepository
                .findByPsychologist_IdAndStartTimeBetweenOrderByStartTimeAsc(
                        psychologistId, start.minusSeconds(3599), end.plusSeconds(3599));
        return existing.stream()
                .filter(apt -> AppointmentStatusEnum.CANCELLED != apt.getStatus())
                .anyMatch(apt -> start.isBefore(apt.getEndTime()) && end.isAfter(apt.getStartTime()));
    }

    private boolean hasAbsenceOverlap(Long psychologistId, Instant start, Instant end) {
        List<PsychAbsenceEntity> absences = psychAbsenceRepository.findOverlapping(psychologistId, start, end);
        return !absences.isEmpty();
    }

    private BigDecimal getSessionPrice(Long psychologistId) {
        return psychologistProfileRepository.findByUser_Id(psychologistId)
                .map(profile -> {
                    String pricesJson = profile.getSessionPrices();
                    if (pricesJson == null || pricesJson.isBlank()) return null;
                    try {
                        JsonNode node = objectMapper.readTree(pricesJson);
                        JsonNode individual = node.get("individual");
                        if (individual != null && !individual.isNull()) {
                            return new BigDecimal(individual.asText());
                        }
                    } catch (Exception e) {
                        logger.warn("Failed to parse sessionPrices for psychologist {}: {}", psychologistId, e.getMessage());
                    }
                    return null;
                })
                .orElse(null);
    }

    private void validateTimeBlock(String start, String end, String blockName) {
        if (start == null || end == null) {
            throw new IllegalArgumentException(blockName + ": las horas de inicio y fin son obligatorias");
        }
        if (!start.matches("\\d{2}:\\d{2}") || !end.matches("\\d{2}:\\d{2}")) {
            throw new IllegalArgumentException(blockName + ": formato de hora inválido (usar HH:mm)");
        }
        LocalTime startTime = LocalTime.parse(start);
        LocalTime endTime = LocalTime.parse(end);
        if (!endTime.isAfter(startTime)) {
            throw new IllegalArgumentException(blockName + ": la hora de fin (" + end + ") debe ser posterior a la de inicio (" + start + ")");
        }
    }
}
