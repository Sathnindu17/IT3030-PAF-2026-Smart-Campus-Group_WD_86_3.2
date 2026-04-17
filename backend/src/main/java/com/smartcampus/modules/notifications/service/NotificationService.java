package com.smartcampus.modules.notifications.service;

import com.smartcampus.common.exception.ResourceNotFoundException;
import com.smartcampus.modules.notifications.dto.NotificationResponse;
import com.smartcampus.modules.notifications.entity.Notification;
import com.smartcampus.modules.notifications.repository.NotificationRepository;
import com.smartcampus.modules.users.entity.User;
import com.smartcampus.modules.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    private static final List<String> ALL_TYPES = Arrays.asList("SECURITY", "BOOKING", "TICKET", "SYSTEM", "GENERAL");

    public void create(String recipientId, String title, String message) {
        create(recipientId, title, message, "GENERAL");
    }

    public void create(String recipientId, String title, String message, String type) {
        Notification notification = Notification.builder()
                .recipientId(recipientId)
                .title(title)
                .message(message)
                .type(type != null ? type : "GENERAL")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }

    public List<NotificationResponse> getMyNotifications(String userId) {
        List<String> enabledTypes = getEnabledTypes(userId);
        if (enabledTypes != null && !enabledTypes.isEmpty()) {
            return notificationRepository.findByRecipientIdAndTypeInOrderByCreatedAtDesc(userId, enabledTypes).stream()
                    .map(this::toResponse).collect(Collectors.toList());
        }
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public long getUnreadCount(String userId) {
        List<String> enabledTypes = getEnabledTypes(userId);
        if (enabledTypes != null && !enabledTypes.isEmpty()) {
            return notificationRepository.countByRecipientIdAndIsReadFalseAndTypeIn(userId, enabledTypes);
        }
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    public NotificationResponse markAsRead(String notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        notification.setRead(true);
        notification = notificationRepository.save(notification);
        return toResponse(notification);
    }

    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByRecipientIdAndIsReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    private List<String> getEnabledTypes(String userId) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null && user.getNotificationPreferences() != null
                    && user.getNotificationPreferences().getEnabledTypes() != null
                    && !user.getNotificationPreferences().getEnabledTypes().isEmpty()) {
                return user.getNotificationPreferences().getEnabledTypes();
            }
        } catch (Exception e) {
            // If preferences can't be loaded, return all types
        }
        return ALL_TYPES;
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt() != null ? notification.getCreatedAt().toString() : null)
                .build();
    }
}
