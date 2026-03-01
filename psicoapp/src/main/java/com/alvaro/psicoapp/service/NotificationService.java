package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.NotificationEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.NotificationRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public void createNotification(Long userId, String type, String title, String message) {
        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        NotificationEntity notification = new NotificationEntity();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setCreatedAt(Instant.now());
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getNotifications(UserEntity user) {
        List<NotificationEntity> notifications = notificationRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
        return notifications.stream().map(n -> {
            Map<String, Object> map = new java.util.LinkedHashMap<>();
            map.put("id", n.getId());
            map.put("type", n.getType());
            map.put("title", n.getTitle());
            map.put("message", n.getMessage());
            map.put("read", n.isRead());
            map.put("createdAt", n.getCreatedAt());
            return map;
        }).toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UserEntity user) {
        return notificationRepository.countByUser_IdAndReadFalse(user.getId());
    }

    @Transactional
    public void markAsRead(UserEntity user, Long notificationId) {
        NotificationEntity notification = notificationRepository.findById(notificationId).orElse(null);
        if (notification != null && notification.getUser().getId().equals(user.getId())) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllAsRead(UserEntity user) {
        notificationRepository.markAllAsRead(user.getId());
    }
}
