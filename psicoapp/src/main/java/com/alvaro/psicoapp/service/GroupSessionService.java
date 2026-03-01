package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GroupSessionService {
    private final GroupSessionRepository groupSessionRepository;
    private final GroupSessionParticipantRepository participantRepository;
    private final UserRepository userRepository;

    public GroupSessionService(GroupSessionRepository groupSessionRepository,
                               GroupSessionParticipantRepository participantRepository,
                               UserRepository userRepository) {
        this.groupSessionRepository = groupSessionRepository;
        this.participantRepository = participantRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public GroupSessionEntity createSession(UserEntity psychologist, String title, String description,
                                            Instant startTime, Instant endTime, Integer maxParticipants) {
        if (!RoleConstants.PSYCHOLOGIST.equals(psychologist.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo los psicólogos pueden crear sesiones grupales");
        }
        GroupSessionEntity session = new GroupSessionEntity();
        session.setTitle(title);
        session.setDescription(description);
        session.setPsychologist(psychologist);
        session.setStartTime(startTime);
        session.setEndTime(endTime);
        session.setMaxParticipants(maxParticipants != null ? maxParticipants : 10);
        session.setStatus("SCHEDULED");
        session.setJitsiRoomName("gantly-group-" + UUID.randomUUID().toString().substring(0, 8));
        return groupSessionRepository.save(session);
    }

    @Transactional
    public void joinSession(UserEntity user, Long sessionId) {
        GroupSessionEntity session = groupSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sesión no encontrada"));
        if (!"SCHEDULED".equals(session.getStatus()) && !"ACTIVE".equals(session.getStatus())) {
            throw new IllegalArgumentException("Esta sesión ya no acepta participantes");
        }
        if (participantRepository.findByGroupSession_IdAndUser_Id(sessionId, user.getId()).isPresent()) {
            throw new IllegalArgumentException("Ya estás inscrito en esta sesión");
        }
        long count = participantRepository.countByGroupSession_Id(sessionId);
        if (count >= session.getMaxParticipants()) {
            throw new IllegalArgumentException("La sesión está llena");
        }
        GroupSessionParticipantEntity participant = new GroupSessionParticipantEntity();
        participant.setGroupSession(session);
        participant.setUser(user);
        participantRepository.save(participant);
    }

    @Transactional
    public void leaveSession(UserEntity user, Long sessionId) {
        var participant = participantRepository.findByGroupSession_IdAndUser_Id(sessionId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No estás inscrito en esta sesión"));
        participantRepository.delete(participant);
    }

    public List<Map<String, Object>> listUpcoming() {
        return groupSessionRepository.findByStartTimeAfterAndStatusOrderByStartTimeAsc(Instant.now(), "SCHEDULED")
                .stream().map(this::toMap).collect(Collectors.toList());
    }

    public List<Map<String, Object>> listMyGroupSessions(UserEntity user) {
        List<GroupSessionEntity> sessions = new ArrayList<>();
        if (RoleConstants.PSYCHOLOGIST.equals(user.getRole())) {
            sessions.addAll(groupSessionRepository.findByPsychologist_IdOrderByStartTimeDesc(user.getId()));
        }
        sessions.addAll(groupSessionRepository.findByParticipantUserId(user.getId()));
        return sessions.stream().distinct().map(this::toMap).collect(Collectors.toList());
    }

    public Map<String, Object> getSessionDetails(Long sessionId) {
        GroupSessionEntity session = groupSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sesión no encontrada"));
        Map<String, Object> map = toMap(session);
        List<Map<String, Object>> participants = participantRepository.findByGroupSession_Id(sessionId).stream()
                .map(p -> {
                    Map<String, Object> pm = new LinkedHashMap<>();
                    pm.put("id", p.getUser().getId());
                    pm.put("name", p.getUser().getName());
                    pm.put("joinedAt", p.getJoinedAt().toString());
                    return pm;
                }).collect(Collectors.toList());
        map.put("participants", participants);
        return map;
    }

    private Map<String, Object> toMap(GroupSessionEntity s) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", s.getId());
        map.put("title", s.getTitle());
        map.put("description", s.getDescription());
        map.put("psychologistId", s.getPsychologist().getId());
        map.put("psychologistName", s.getPsychologist().getName());
        map.put("maxParticipants", s.getMaxParticipants());
        map.put("currentParticipants", participantRepository.countByGroupSession_Id(s.getId()));
        map.put("startTime", s.getStartTime().toString());
        map.put("endTime", s.getEndTime().toString());
        map.put("status", s.getStatus());
        map.put("jitsiRoomName", s.getJitsiRoomName());
        map.put("createdAt", s.getCreatedAt().toString());
        return map;
    }
}
