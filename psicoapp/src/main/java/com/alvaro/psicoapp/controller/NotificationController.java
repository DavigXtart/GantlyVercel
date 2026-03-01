package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.service.CurrentUserService;
import com.alvaro.psicoapp.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notificaciones", description = "APIs para gestión de notificaciones in-app")
public class NotificationController {
    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    public NotificationController(NotificationService notificationService, CurrentUserService currentUserService) {
        this.notificationService = notificationService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    @Operation(summary = "Obtener notificaciones")
    public ResponseEntity<List<Map<String, Object>>> getNotifications(Principal principal) {
        return ResponseEntity.ok(notificationService.getNotifications(currentUserService.getCurrentUser(principal)));
    }

    @GetMapping("/count")
    @Operation(summary = "Obtener cantidad de no leídas")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Principal principal) {
        long count = notificationService.getUnreadCount(currentUserService.getCurrentUser(principal));
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping("/{id}/read")
    @Transactional
    @Operation(summary = "Marcar como leída")
    public ResponseEntity<Void> markAsRead(Principal principal, @PathVariable Long id) {
        notificationService.markAsRead(currentUserService.getCurrentUser(principal), id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/read-all")
    @Transactional
    @Operation(summary = "Marcar todas como leídas")
    public ResponseEntity<Void> markAllAsRead(Principal principal) {
        notificationService.markAllAsRead(currentUserService.getCurrentUser(principal));
        return ResponseEntity.ok().build();
    }
}
