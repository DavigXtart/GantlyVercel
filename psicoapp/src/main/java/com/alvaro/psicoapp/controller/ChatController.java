package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.ChatMessageEntity;
import com.alvaro.psicoapp.repository.ChatMessageRepository;
import com.alvaro.psicoapp.repository.UserRepository;
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
                System.err.println("❌ ChatController: Principal es null - no hay autenticación");
                return;
            }
            
            String principalName = principal.getName();
            System.out.println("=== ChatController: Mensaje recibido ===");
            System.out.println("Principal name: " + principalName);
            
            var me = userRepository.findByEmail(principalName).orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + principalName));
            String content = body.getOrDefault("content", "");
            
            System.out.println("De: " + me.getEmail() + " (rol: " + me.getRole() + ", ID: " + me.getId() + ")");
            System.out.println("psychologistId=" + psychologistId + ", userId=" + userId);
            System.out.println("contenido=" + content);
            
            if (content == null || content.trim().isEmpty()) {
                System.err.println("❌ ChatController: contenido vacío, ignorando mensaje");
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
                System.err.println("❌ ChatController: Usuario no autorizado. Usuario ID: " + me.getId() + ", Intentando enviar a psychologistId: " + psychologistId + ", userId: " + userId);
                return;
            }
            
            ChatMessageEntity msg = new ChatMessageEntity();
            msg.setPsychologist(psychologist);
            msg.setUser(user);
            msg.setSender("PSYCHOLOGIST".equals(me.getRole()) ? "PSYCHOLOGIST" : "USER");
            msg.setContent(content.trim());
            
            System.out.println("💾 Guardando mensaje en BD...");
            saved = chatMessageRepository.save(msg);
            chatMessageRepository.flush(); // Forzar flush inmediato
            
            System.out.println("✅ Mensaje guardado con ID: " + saved.getId());
            
            // Verificar que realmente se guardó
            var verify = chatMessageRepository.findById(saved.getId());
            if (verify.isEmpty()) {
                System.err.println("❌ ERROR: El mensaje no se guardó en la BD después del save!");
                return;
            }
            
            Map<String, Object> messagePayload = new HashMap<>();
            messagePayload.put("id", saved.getId());
            messagePayload.put("sender", saved.getSender());
            messagePayload.put("content", saved.getContent());
            messagePayload.put("createdAt", saved.getCreatedAt().toString());
            
            String topic = "/topic/chat/" + psychologistId + "/" + userId;
            System.out.println("📤 Enviando mensaje a topic: " + topic);
            System.out.println("📤 Payload: " + messagePayload);
            
            // Enviar a ambos usuarios que están suscritos al mismo topic
            messagingTemplate.convertAndSend(topic, messagePayload);
            System.out.println("✅ Mensaje enviado exitosamente al topic");
            
        } catch (Exception e) {
            System.err.println("❌ ChatController: Error enviando mensaje: " + e.getMessage());
            System.err.println("Error class: " + e.getClass().getName());
            e.printStackTrace();
            if (saved != null && saved.getId() != null) {
                System.err.println("Intentando eliminar mensaje guardado con ID: " + saved.getId());
                try {
                    chatMessageRepository.deleteById(saved.getId());
                } catch (Exception deleteEx) {
                    System.err.println("Error al eliminar mensaje: " + deleteEx.getMessage());
                }
            }
        }
    }
}

//V1

