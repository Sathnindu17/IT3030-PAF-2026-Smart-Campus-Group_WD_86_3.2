package com.smartcampus.modules.comments.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CommentRequest {

    @NotBlank(message = "Ticket ID is required")
    private String ticketId;

    @NotBlank(message = "Message is required")
    private String message;
}
