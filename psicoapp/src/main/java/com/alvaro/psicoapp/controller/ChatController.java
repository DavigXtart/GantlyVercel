package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.ChatMessageEntity;
import com.alvaro.psicoapp.repository.ChatMessageRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@Controller
public class ChatController {
    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    public ChatController(SimpMessagingTemplate messagingTemplate, ChatMessageRepository chatMessageRepository, UserRepository userRepository) {
        this.messagingTemplate = messagingTemplate;
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
    }

    @MessageMapping("/chat/{psychologistId}/{userId}")
    @Transactional
    public void sendMessage(Principal principal, @DestinationVariable Long psychologistId, @DestinationVariable Long userId, @Payload Map<String, String> body) {
        ChatMessageEntity saved = null;
        try {
            if (principal == null) {
                logger.warn("ChatController: Principal es null - no hay autenticación");
                return;
            }
            
            String principalName = principal.getName();
            logger.debug("ChatController: Mensaje recibido desde: {}", principalName);
            
            var me = userRepository.findByEmail(principalName).orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + principalName));
            String content = body.getOrDefault("content", "");
            
            logger.debug("Mensaje de: {} (rol: {}, ID: {}), psychologistId={}, userId={}", 
                me.getEmail(), me.getRole(), me.getId(), psychologistId, userId);
            
            if (content == null || content.trim().isEmpty()) {
                logger.warn("ChatController: contenido vacío, ignorando mensaje");
                return;
            }
            
            var psychologist = userRepository.findById(psychologistId).orElseThrow(() -> new RuntimeException("Psicólogo no encontrado: " + psychologistId));
            var user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + userId));
            
            // Validación de seguridad: el usuario solo puede enviar mensajes en conversaciones donde él es parte
            boolean isAuthorized = false;
            if ("PSYCHOLOGIST".equals(me.getRole())) {
                // Si es psicólogo, debe ser el psicólogo de esta conversación
                isAuthorized = me.getId().equals(psychologistId);
            } else if ("USER".equals(me.getRole())) {
                // Si es usuario normal, debe ser el usuario de esta conversación
                isAuthorized = me.getId().equals(userId);
            }
            
            if (!isAuthorized) {
                logger.warn("ChatController: Usuario no autorizado. Usuario ID: {}, Intentando enviar a psychologistId: {}, userId: {}", 
                    me.getId(), psychologistId, userId);
                return;
            }
            
            ChatMessageEntity msg = new ChatMessageEntity();
            msg.setPsychologist(psychologist);
            msg.setUser(user);
            msg.setSender("PSYCHOLOGIST".equals(me.getRole()) ? "PSYCHOLOGIST" : "USER");
            msg.setContent(content.trim());
            
            logger.debug("Guardando mensaje en BD...");
            saved = chatMessageRepository.save(msg);
            chatMessageRepository.flush(); // Forzar flush inmediato
            
            logger.debug("Mensaje guardado con ID: {}", saved.getId());
            
            // Verificar que realmente se guardó
            var verify = chatMessageRepository.findById(saved.getId());
            if (verify.isEmpty()) {
                logger.error("ERROR: El mensaje no se guardó en la BD después del save!");
                return;
            }
            
            Map<String, Object> messagePayload = new HashMap<>();
            messagePayload.put("id", saved.getId());
            messagePayload.put("sender", saved.getSender());
            messagePayload.put("content", saved.getContent());
            messagePayload.put("createdAt", saved.getCreatedAt().toString());
            
            String topic = "/topic/chat/" + psychologistId + "/" + userId;
            logger.debug("Enviando mensaje a topic: {}, payload: {}", topic, messagePayload);
            
            // Enviar a ambos usuarios que están suscritos al mismo topic
            messagingTemplate.convertAndSend(topic, messagePayload);
            logger.debug("Mensaje enviado exitosamente al topic");
            
        } catch (Exception e) {
            logger.error("ChatController: Error enviando mensaje", e);
            if (saved != null && saved.getId() != null) {
                logger.debug("Intentando eliminar mensaje guardado con ID: {}", saved.getId());
                try {
                    chatMessageRepository.deleteById(saved.getId());
                } catch (Exception deleteEx) {
                    logger.error("Error al eliminar mensaje", deleteEx);
                }
            }
        }
    }
}

//V1

