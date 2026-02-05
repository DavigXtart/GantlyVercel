package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.ChatMessageEntity;
import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.ChatDtos;
import com.alvaro.psicoapp.repository.ChatMessageRepository;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ChatService {
    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);

    private final ChatMessageRepository chatMessageRepository;
    private final UserPsychologistRepository userPsychologistRepository;
    private final UserRepository userRepository;

    public ChatService(ChatMessageRepository chatMessageRepository,
                       UserPsychologistRepository userPsychologistRepository,
                       UserRepository userRepository) {
        this.chatMessageRepository = chatMessageRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ChatDtos.MessageDto> getChatHistory(UserEntity me, Long userId) {
        List<ChatMessageEntity> messages;
        if (RoleConstants.USER.equals(me.getRole())) {
            var rel = userPsychologistRepository.findByUserId(me.getId());
            if (rel.isEmpty()) return List.of();
            messages = chatMessageRepository.findTop100ByPsychologist_IdAndUser_IdOrderByCreatedAtDesc(
                    rel.get().getPsychologist().getId(), me.getId());
        } else if (RoleConstants.PSYCHOLOGIST.equals(me.getRole())) {
            if (userId == null) throw new IllegalArgumentException("userId requerido");
            messages = chatMessageRepository.findTop100ByPsychologist_IdAndUser_IdOrderByCreatedAtDesc(me.getId(), userId);
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return messages.stream().map(this::toMessageDto).collect(Collectors.toList());
    }

    @Transactional
    public ChatDtos.MessageDto createMessage(String principalEmail, Long psychologistId, Long userId, String content) {
        if (principalEmail == null || principalEmail.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
        }
        if (psychologistId == null || userId == null) {
            throw new IllegalArgumentException("psychologistId y userId son obligatorios");
        }
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("content vacío");
        }

        var me = userRepository.findByEmail(principalEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        var psychologist = userRepository.findById(psychologistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Psicólogo no encontrado"));
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        boolean isAuthorized = false;
        if (RoleConstants.PSYCHOLOGIST.equals(me.getRole())) {
            isAuthorized = Objects.equals(me.getId(), psychologistId);
        } else if (RoleConstants.USER.equals(me.getRole())) {
            isAuthorized = Objects.equals(me.getId(), userId);
        }
        if (!isAuthorized) {
            logger.warn("Chat: usuario no autorizado. meId={}, role={}, psychologistId={}, userId={}",
                    me.getId(), me.getRole(), psychologistId, userId);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
        }

        ChatMessageEntity msg = new ChatMessageEntity();
        msg.setPsychologist(psychologist);
        msg.setUser(user);
        msg.setSender(RoleConstants.PSYCHOLOGIST.equals(me.getRole()) ? RoleConstants.PSYCHOLOGIST : RoleConstants.USER);
        msg.setContent(content.trim());

        ChatMessageEntity saved = chatMessageRepository.save(msg);
        chatMessageRepository.flush();

        // Verificación extra por seguridad (mantiene el comportamiento anterior)
        if (saved.getId() == null || chatMessageRepository.findById(saved.getId()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "El mensaje no se guardó");
        }

        return toMessageDto(saved);
    }

    @Transactional
    public void deleteMessageById(Long id) {
        if (id == null) return;
        chatMessageRepository.deleteById(id);
    }

    private ChatDtos.MessageDto toMessageDto(ChatMessageEntity msg) {
        return new ChatDtos.MessageDto(msg.getId(), msg.getSender(), msg.getContent(),
                msg.getCreatedAt() != null ? msg.getCreatedAt().toString() : null);
    }
}
