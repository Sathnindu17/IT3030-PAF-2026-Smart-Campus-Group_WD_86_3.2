package com.smartcampus.modules.comments.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private String id;
    private String ticketId;
    private String authorId;
    private String authorName;
    private String message;
    private String createdAt;
    private String updatedAt;
}
