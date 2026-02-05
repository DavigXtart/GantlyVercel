package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.dto.ChatDtos;
import com.alvaro.psicoapp.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.util.Map;

@Controller
public class ChatController {
    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    public ChatController(SimpMessagingTemplate messagingTemplate, ChatService chatService) {
        this.messagingTemplate = messagingTemplate;
        this.chatService = chatService;
    }

    @MessageMapping("/chat/{psychologistId}/{userId}")
    @Transactional
    public void sendMessage(Principal principal, @DestinationVariable Long psychologistId, @DestinationVariable Long userId, @Payload Map<String, String> body) {
        ChatDtos.MessageDto savedDto = null;
        try {
            if (principal == null) {
                logger.warn("ChatController: Principal es null - no hay autenticación");
                return;
            }
            
            String principalName = principal.getName();
            logger.debug("ChatController: Mensaje recibido desde: {}", principalName);
            
            String content = body.getOrDefault("content", "");
            
            savedDto = chatService.createMessage(principalName, psychologistId, userId, content);
            
            String topic = "/topic/chat/" + psychologistId + "/" + userId;
            logger.debug("Enviando mensaje a topic: {}, payload: {}", topic, savedDto);
            
            // Enviar a ambos usuarios que están suscritos al mismo topic
            messagingTemplate.convertAndSend(topic, savedDto);
            logger.debug("Mensaje enviado exitosamente al topic");
            
        } catch (Exception e) {
            logger.error("ChatController: Error enviando mensaje", e);
            if (savedDto != null && savedDto.id() != null) {
                logger.debug("Intentando eliminar mensaje guardado con ID: {}", savedDto.id());
                try {
                    chatService.deleteMessageById(savedDto.id());
                } catch (Exception deleteEx) {
                    logger.error("Error al eliminar mensaje", deleteEx);
                }
            }
        }
    }
}

//V1

