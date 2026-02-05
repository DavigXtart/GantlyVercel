package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.dto.ChatDtos;
import com.alvaro.psicoapp.service.CurrentUserService;
import com.alvaro.psicoapp.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatRestController {
    private final ChatService chatService;
    private final CurrentUserService currentUserService;

    public ChatRestController(ChatService chatService, CurrentUserService currentUserService) {
        this.chatService = chatService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/history")
    @Transactional(readOnly = true)
    public ResponseEntity<List<ChatDtos.MessageDto>> myHistory(Principal principal, @RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(chatService.getChatHistory(currentUserService.getCurrentUser(principal), userId));
    }
}
