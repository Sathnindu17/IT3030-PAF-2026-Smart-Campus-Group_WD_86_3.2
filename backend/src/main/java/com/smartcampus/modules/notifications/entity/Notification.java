package com.smartcampus.modules.notifications.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    private String recipientId;
    private String title;
    private String message;
    private String type; // SECURITY, BOOKING, TICKET, SYSTEM, GENERAL
    private boolean isRead;
    private LocalDateTime createdAt;
}
