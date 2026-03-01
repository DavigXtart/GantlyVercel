package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.NotificationEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.NotificationRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    private NotificationService notificationService;

    private UserEntity testUser;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository, userRepository);

        testUser = new UserEntity();
        testUser.setId(1L);
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");
        testUser.setRole("USER");
    }

    // ── createNotification ──────────────────────────────────────────────

    @Test
    @DisplayName("createNotification - saves notification when user exists")
    void createNotification_userExists_savesNotification() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        notificationService.createNotification(1L, "INFO", "Welcome", "Welcome to the platform");

        ArgumentCaptor<NotificationEntity> captor = ArgumentCaptor.forClass(NotificationEntity.class);
        verify(notificationRepository).save(captor.capture());

        NotificationEntity saved = captor.getValue();
        assertEquals(testUser, saved.getUser());
        assertEquals("INFO", saved.getType());
        assertEquals("Welcome", saved.getTitle());
        assertEquals("Welcome to the platform", saved.getMessage());
        assertNotNull(saved.getCreatedAt());
    }

    @Test
    @DisplayName("createNotification - does nothing when user not found")
    void createNotification_userNotFound_doesNotSave() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        notificationService.createNotification(999L, "INFO", "Title", "Message");

        verify(notificationRepository, never()).save(any());
    }

    // ── getNotifications ────────────────────────────────────────────────

    @Test
    @DisplayName("getNotifications - returns mapped list with correct keys")
    void getNotifications_returnsMappedList() {
        Instant now = Instant.now();

        NotificationEntity n1 = new NotificationEntity();
        n1.setId(10L);
        n1.setType("TASK");
        n1.setTitle("New task");
        n1.setMessage("You have a new task");
        n1.setRead(false);
        n1.setCreatedAt(now);
        n1.setUser(testUser);

        NotificationEntity n2 = new NotificationEntity();
        n2.setId(11L);
        n2.setType("APPOINTMENT");
        n2.setTitle("Appointment booked");
        n2.setMessage("Your appointment is confirmed");
        n2.setRead(true);
        n2.setCreatedAt(now.minusSeconds(60));
        n2.setUser(testUser);

        when(notificationRepository.findByUser_IdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(n1, n2));

        List<Map<String, Object>> result = notificationService.getNotifications(testUser);

        assertEquals(2, result.size());

        Map<String, Object> first = result.get(0);
        assertEquals(10L, first.get("id"));
        assertEquals("TASK", first.get("type"));
        assertEquals("New task", first.get("title"));
        assertEquals("You have a new task", first.get("message"));
        assertEquals(false, first.get("read"));
        assertEquals(now, first.get("createdAt"));

        Map<String, Object> second = result.get(1);
        assertEquals(11L, second.get("id"));
        assertEquals("APPOINTMENT", second.get("type"));
        assertEquals(true, second.get("read"));
    }

    @Test
    @DisplayName("getNotifications - returns empty list when no notifications")
    void getNotifications_empty_returnsEmptyList() {
        when(notificationRepository.findByUser_IdOrderByCreatedAtDesc(1L))
                .thenReturn(Collections.emptyList());

        List<Map<String, Object>> result = notificationService.getNotifications(testUser);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // ── getUnreadCount ──────────────────────────────────────────────────

    @Test
    @DisplayName("getUnreadCount - returns count from repository")
    void getUnreadCount_returnsCount() {
        when(notificationRepository.countByUser_IdAndReadFalse(1L)).thenReturn(5L);

        long count = notificationService.getUnreadCount(testUser);

        assertEquals(5L, count);
        verify(notificationRepository).countByUser_IdAndReadFalse(1L);
    }

    @Test
    @DisplayName("getUnreadCount - returns zero when no unread notifications")
    void getUnreadCount_zeroUnread() {
        when(notificationRepository.countByUser_IdAndReadFalse(1L)).thenReturn(0L);

        long count = notificationService.getUnreadCount(testUser);

        assertEquals(0L, count);
    }

    // ── markAsRead ──────────────────────────────────────────────────────

    @Test
    @DisplayName("markAsRead - marks notification as read when it belongs to user")
    void markAsRead_belongsToUser_marksRead() {
        NotificationEntity notification = new NotificationEntity();
        notification.setId(10L);
        notification.setUser(testUser);
        notification.setRead(false);

        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notification));

        notificationService.markAsRead(testUser, 10L);

        assertTrue(notification.isRead());
        verify(notificationRepository).save(notification);
    }

    @Test
    @DisplayName("markAsRead - does nothing when notification belongs to different user")
    void markAsRead_differentUser_doesNotMark() {
        UserEntity otherUser = new UserEntity();
        otherUser.setId(2L);

        NotificationEntity notification = new NotificationEntity();
        notification.setId(10L);
        notification.setUser(otherUser);
        notification.setRead(false);

        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notification));

        notificationService.markAsRead(testUser, 10L);

        assertFalse(notification.isRead());
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("markAsRead - does nothing when notification not found")
    void markAsRead_notFound_doesNothing() {
        when(notificationRepository.findById(999L)).thenReturn(Optional.empty());

        notificationService.markAsRead(testUser, 999L);

        verify(notificationRepository, never()).save(any());
    }

    // ── markAllAsRead ───────────────────────────────────────────────────

    @Test
    @DisplayName("markAllAsRead - delegates to repository with user id")
    void markAllAsRead_delegatesToRepository() {
        notificationService.markAllAsRead(testUser);

        verify(notificationRepository).markAllAsRead(1L);
    }
}
