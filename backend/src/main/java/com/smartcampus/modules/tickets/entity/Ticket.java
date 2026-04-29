package com.smartcampus.modules.tickets.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
//Ticket entity represents the ticket data stored in MongoDB, including details, status, priority, and timestamps
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "tickets")
public class Ticket {

    @Id
    private String id;

    private String title;
    private String category;
    private String description;
    private TicketPriority priority;
    private String preferredContact;
    private String resourceId;
    private String location;
    private List<String> attachmentUrls;
    private String assignedTechnicianId;
    private String resolutionNotes;
    private TicketStatus status;
    private String createdBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public enum TicketStatus {
        OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED
    }

    public enum TicketPriority {
        LOW, MEDIUM, HIGH, URGENT
    }
}
