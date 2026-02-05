package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.AppointmentEntity;
import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.JitsiDtos;
import com.alvaro.psicoapp.repository.AppointmentRepository;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

@Service
public class JitsiService {
    private static final Logger logger = LoggerFactory.getLogger(JitsiService.class);
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;

    public JitsiService(AppointmentRepository appointmentRepository, UserRepository userRepository,
                        UserPsychologistRepository userPsychologistRepository) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
    }

    @Transactional(readOnly = true)
    public JitsiDtos.RoomInfoResponse getRoomInfo(String currentUserEmail, String otherUserEmail) {
        UserEntity currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario actual no encontrado"));
        UserEntity otherUser = userRepository.findByEmail(otherUserEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario destino no encontrado"));

        boolean hasValidRelation = false;
        if (RoleConstants.PSYCHOLOGIST.equals(currentUser.getRole()) && RoleConstants.USER.equals(otherUser.getRole())) {
            var relation = userPsychologistRepository.findByUserId(otherUser.getId());
            if (relation.isPresent() && relation.get().getPsychologist().getId().equals(currentUser.getId())) {
                hasValidRelation = true;
            }
        } else if (RoleConstants.USER.equals(currentUser.getRole()) && RoleConstants.PSYCHOLOGIST.equals(otherUser.getRole())) {
            var relation = userPsychologistRepository.findByUserId(currentUser.getId());
            if (relation.isPresent() && relation.get().getPsychologist().getId().equals(otherUser.getId())) {
                hasValidRelation = true;
            }
        }

        if (hasValidRelation) {
            Instant now = Instant.now();
            Instant oneHourBefore = now.minusSeconds(3600);
            List<AppointmentEntity> activeAppointments;
            if (RoleConstants.PSYCHOLOGIST.equals(currentUser.getRole())) {
                activeAppointments = appointmentRepository
                        .findByPsychologist_IdAndUser_IdAndStartTimeGreaterThanEqualAndStatusIn(
                                currentUser.getId(), otherUser.getId(), oneHourBefore);
            } else {
                activeAppointments = appointmentRepository
                        .findByPsychologist_IdAndUser_IdAndStartTimeGreaterThanEqualAndStatusIn(
                                otherUser.getId(), currentUser.getId(), oneHourBefore);
            }

            AppointmentEntity validAppointment = activeAppointments.stream()
                    .filter(apt -> {
                        Instant startTime = apt.getStartTime();
                        Instant endTime = apt.getEndTime();
                        Instant oneHourBeforeStart = startTime.minusSeconds(3600);
                        Instant oneHourAfterEnd = endTime.plusSeconds(3600);
                        return (now.isAfter(oneHourBeforeStart) || now.equals(oneHourBeforeStart))
                                && (now.isBefore(oneHourAfterEnd) || now.equals(oneHourAfterEnd));
                    })
                    .findFirst()
                    .orElse(null);

            if (validAppointment != null) {
                String email1 = currentUser.getEmail().toLowerCase().trim();
                String email2 = otherUser.getEmail().toLowerCase().trim();
                String[] emails = {email1, email2};
                Arrays.sort(emails);
                String roomName = "psymatch-" + emails[0].replace("@", "-at-").replace(".", "-")
                        + "-" + emails[1].replace("@", "-at-").replace(".", "-");
                roomName = roomName.replaceAll("--+", "-").replaceAll("^-|-$", "");
                if (roomName.length() > 50) roomName = roomName.substring(0, 50);

                logger.info("Videollamada iniciada: {} <-> {} (Sala: {})", currentUser.getEmail(), otherUser.getEmail(), roomName);
                return new JitsiDtos.RoomInfoResponse(roomName,
                        new JitsiDtos.UserInfo(currentUser.getEmail(), currentUser.getName()),
                        new JitsiDtos.UserInfo(otherUser.getEmail(), otherUser.getName()), true);
            }

            if (!activeAppointments.isEmpty()) {
                AppointmentEntity nextAppointment = activeAppointments.stream()
                        .filter(apt -> apt.getStartTime().isAfter(now))
                        .min(Comparator.comparing(AppointmentEntity::getStartTime))
                        .orElse(null);
                if (nextAppointment != null) {
                    Instant startTime = nextAppointment.getStartTime();
                    Instant oneHourBeforeAppointment = startTime.minusSeconds(3600);
                    if (now.isBefore(oneHourBeforeAppointment)) {
                        long minutesUntil = (oneHourBeforeAppointment.toEpochMilli() - now.toEpochMilli()) / (1000 * 60);
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                "Solo puedes iniciar la videollamada máximo 1 hora antes de la cita. Podrás iniciarla en " + minutesUntil + " minutos.");
                    }
                }
            }
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "No tienes una cita activa con este usuario o no existe relación válida. Solo puedes iniciar videollamadas máximo 1 hora antes de la hora de la cita.");
    }
}
