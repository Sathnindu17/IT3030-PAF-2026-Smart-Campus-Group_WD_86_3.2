package com.smartcampus.modules.tickets.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {
    private String id;
    private String title;
    private String category;
    private String description;
    private String priority;
    private String preferredContact;
    private String resourceId;
    private String resourceName;
    private String location;
    private List<String> attachmentUrls;
    private String assignedTechnicianId;
    private String assignedTechnicianName;
    private String resolutionNotes;
    private String status;
    private String createdBy;
    private String createdByName;
    private String createdAt;
    private String updatedAt;
}
