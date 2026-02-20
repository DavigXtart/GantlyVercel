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

/**
 * Servicio de chat con cifrado End-to-End (E2E).
 * Garantiza que solo el psicólogo asignado y el paciente puedan ver los mensajes.
 * Cumple con RGPD: ni siquiera el admin puede ver los mensajes cifrados.
 */
@Service
public class ChatService {
    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);

    private final ChatMessageRepository chatMessageRepository;
    private final UserPsychologistRepository userPsychologistRepository;
    private final UserRepository userRepository;
    private final ChatEncryptionService encryptionService;
    private final AuditService auditService;

    public ChatService(ChatMessageRepository chatMessageRepository,
                       UserPsychologistRepository userPsychologistRepository,
                       UserRepository userRepository,
                       ChatEncryptionService encryptionService,
                       AuditService auditService) {
        this.chatMessageRepository = chatMessageRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.userRepository = userRepository;
        this.encryptionService = encryptionService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<ChatDtos.MessageDto> getChatHistory(UserEntity me, Long userId) {
        List<ChatMessageEntity> messages;
        Long psychologistId;
        Long patientId;
        
        if (RoleConstants.USER.equals(me.getRole())) {
            // Usuario solo puede ver sus propios mensajes con su psicólogo asignado
            var rel = userPsychologistRepository.findByUserId(me.getId());
            if (rel.isEmpty()) {
                logger.warn("Usuario {} intentó acceder a chat sin psicólogo asignado", me.getId());
                return List.of();
            }
            psychologistId = rel.get().getPsychologist().getId();
            patientId = me.getId();
            messages = chatMessageRepository.findTop100ByPsychologist_IdAndUser_IdOrderByCreatedAtDesc(
                    psychologistId, patientId);
        } else if (RoleConstants.PSYCHOLOGIST.equals(me.getRole())) {
            // Psicólogo solo puede ver mensajes de SUS pacientes asignados
            if (userId == null) throw new IllegalArgumentException("userId requerido");
            
            // VALIDACIÓN CRÍTICA RGPD: Verificar que el paciente pertenece a este psicólogo
            var rel = userPsychologistRepository.findByUserId(userId);
            if (rel.isEmpty() || !rel.get().getPsychologist().getId().equals(me.getId())) {
                logger.warn("Psicólogo {} intentó acceder a chat de paciente {} no asignado", me.getId(), userId);
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a este chat");
            }
            
            psychologistId = me.getId();
            patientId = userId;
            messages = chatMessageRepository.findTop100ByPsychologist_IdAndUser_IdOrderByCreatedAtDesc(psychologistId, patientId);
        } else {
            // Ni admin ni otros roles pueden ver chats
            logger.warn("Usuario {} con rol {} intentó acceder a chat", me.getId(), me.getRole());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado para ver chats");
        }
        
        // Auditoría RGPD: registrar acceso a mensajes de chat
        if (RoleConstants.PSYCHOLOGIST.equals(me.getRole())) {
            auditService.logPatientDataAccess(psychologistId, patientId, "CHAT_MESSAGES", "READ");
        } else {
            auditService.logSelfDataAccess(patientId, "CHAT_MESSAGES", "READ");
        }
        
        // Descifrar mensajes antes de retornarlos
        return messages.stream()
            .map(msg -> toMessageDtoDecrypted(msg, psychologistId, patientId))
            .collect(Collectors.toList());
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

        // VALIDACIÓN CRÍTICA RGPD: Verificar relación psicólogo-paciente
        if (RoleConstants.PSYCHOLOGIST.equals(me.getRole())) {
            // Psicólogo solo puede enviar a SUS pacientes
            var rel = userPsychologistRepository.findByUserId(userId);
            if (rel.isEmpty() || !rel.get().getPsychologist().getId().equals(psychologistId)) {
                logger.warn("Psicólogo {} intentó enviar mensaje a paciente {} no asignado", psychologistId, userId);
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a este chat");
            }
        } else if (RoleConstants.USER.equals(me.getRole())) {
            // Usuario solo puede enviar a SU psicólogo asignado
            var rel = userPsychologistRepository.findByUserId(userId);
            if (rel.isEmpty() || !rel.get().getPsychologist().getId().equals(psychologistId)) {
                logger.warn("Usuario {} intentó enviar mensaje a psicólogo {} no asignado", userId, psychologistId);
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a este chat");
            }
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado para enviar mensajes");
        }
        
        // CIFRAR mensaje antes de guardarlo en BD
        String encryptedContent = encryptionService.encrypt(content.trim(), psychologistId, userId);
        
        ChatMessageEntity msg = new ChatMessageEntity();
        msg.setPsychologist(psychologist);
        msg.setUser(user);
        msg.setSender(RoleConstants.PSYCHOLOGIST.equals(me.getRole()) ? RoleConstants.PSYCHOLOGIST : RoleConstants.USER);
        msg.setContent(encryptedContent); // Guardar cifrado

        ChatMessageEntity saved = chatMessageRepository.save(msg);
        chatMessageRepository.flush();

        // Verificación extra por seguridad
        if (saved.getId() == null || chatMessageRepository.findById(saved.getId()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "El mensaje no se guardó");
        }

        // Retornar mensaje descifrado al remitente
        return toMessageDtoDecrypted(saved, psychologistId, userId);
    }

    @Transactional
    public void deleteMessageById(Long id) {
        if (id == null) return;
        chatMessageRepository.deleteById(id);
    }

    /**
     * Convierte entidad a DTO descifrando el contenido.
     * Solo el psicólogo asignado y el paciente pueden descifrar.
     */
    private ChatDtos.MessageDto toMessageDtoDecrypted(ChatMessageEntity msg, Long psychologistId, Long userId) {
        try {
            String decryptedContent = encryptionService.decrypt(msg.getContent(), psychologistId, userId);
            return new ChatDtos.MessageDto(msg.getId(), msg.getSender(), decryptedContent,
                    msg.getCreatedAt() != null ? msg.getCreatedAt().toString() : null);
        } catch (Exception e) {
            logger.error("Error descifrando mensaje {} para conversación {}:{}", msg.getId(), psychologistId, userId, e);
            // En caso de error, retornar mensaje indicando error de descifrado
            return new ChatDtos.MessageDto(msg.getId(), msg.getSender(), "[Error descifrando mensaje]",
                    msg.getCreatedAt() != null ? msg.getCreatedAt().toString() : null);
        }
    }
    
    /**
     * Método legacy - mantener para compatibilidad pero no usar
     */
    @Deprecated
    private ChatDtos.MessageDto toMessageDto(ChatMessageEntity msg) {
        // NO usar este método - siempre usar toMessageDtoDecrypted
        return new ChatDtos.MessageDto(msg.getId(), msg.getSender(), "[Mensaje cifrado - usar descifrado]",
                msg.getCreatedAt() != null ? msg.getCreatedAt().toString() : null);
    }
}
