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
        var me = userRepository.findByEmail(principal.getName()).orElseThrow();
        String content = body.getOrDefault("content", "");
        ChatMessageEntity msg = new ChatMessageEntity();
        msg.setPsychologist(userRepository.findById(psychologistId).orElseThrow());
        msg.setUser(userRepository.findById(userId).orElseThrow());
        msg.setSender("PSYCHOLOGIST".equals(me.getRole()) ? "PSYCHOLOGIST" : "USER");
        msg.setContent(content);
        chatMessageRepository.save(msg);
        messagingTemplate.convertAndSend("/topic/chat/" + psychologistId + "/" + userId, Map.of(
                "id", msg.getId(),
                "sender", msg.getSender(),
                "content", msg.getContent(),
                "createdAt", msg.getCreatedAt().toString()
        ));
    }
}


