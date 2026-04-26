package com.smartcampus.modules.notifications.repository;

import com.smartcampus.modules.notifications.entity.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(String recipientId);
    long countByRecipientIdAndIsReadFalse(String recipientId);
    List<Notification> findByRecipientIdAndIsReadFalse(String recipientId);

    // Type-filtered queries for notification preferences
    List<Notification> findByRecipientIdAndTypeInOrderByCreatedAtDesc(String recipientId, List<String> types);
    long countByRecipientIdAndIsReadFalseAndTypeIn(String recipientId, List<String> types);
    List<Notification> findByRecipientIdAndIsReadFalseAndTypeIn(String recipientId, List<String> types);
}
