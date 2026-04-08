package com.smartcampus.modules.comments.service;

import com.smartcampus.common.exception.ForbiddenException;
import com.smartcampus.common.exception.ResourceNotFoundException;
import com.smartcampus.modules.comments.dto.CommentRequest;
import com.smartcampus.modules.comments.dto.CommentResponse;
import com.smartcampus.modules.comments.entity.Comment;
import com.smartcampus.modules.comments.repository.CommentRepository;
import com.smartcampus.modules.notifications.service.NotificationService;
import com.smartcampus.modules.tickets.entity.Ticket;
import com.smartcampus.modules.tickets.repository.TicketRepository;
import com.smartcampus.modules.users.entity.User;
import com.smartcampus.modules.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public CommentResponse create(CommentRequest request, String authorId) {
        // Verify ticket exists
        Ticket ticket = ticketRepository.findById(request.getTicketId())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        Comment comment = Comment.builder()
                .ticketId(request.getTicketId())
                .authorId(authorId)
                .message(request.getMessage())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        comment = commentRepository.save(comment);

        // Notify ticket creator if commenter is not the creator
        if (!ticket.getCreatedBy().equals(authorId)) {
            String authorName = userRepository.findById(authorId)
                    .map(User::getFullName).orElse("Someone");
            notificationService.create(ticket.getCreatedBy(), "New Comment",
                    authorName + " commented on your ticket: " + ticket.getTitle());
        }

        return toResponse(comment);
    }

    public List<CommentResponse> getByTicketId(String ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public CommentResponse update(String commentId, String message, String userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        if (!comment.getAuthorId().equals(userId)) {
            throw new ForbiddenException("You can only edit your own comments");
        }

        comment.setMessage(message);
        comment.setUpdatedAt(LocalDateTime.now());
        comment = commentRepository.save(comment);
        return toResponse(comment);
    }

    public void delete(String commentId, String userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        if (!comment.getAuthorId().equals(userId)) {
            throw new ForbiddenException("You can only delete your own comments");
        }

        commentRepository.deleteById(commentId);
    }

    private CommentResponse toResponse(Comment comment) {
        String authorName = userRepository.findById(comment.getAuthorId())
                .map(User::getFullName).orElse("Unknown");

        return CommentResponse.builder()
                .id(comment.getId())
                .ticketId(comment.getTicketId())
                .authorId(comment.getAuthorId())
                .authorName(authorName)
                .message(comment.getMessage())
                .createdAt(comment.getCreatedAt() != null ? comment.getCreatedAt().toString() : null)
                .updatedAt(comment.getUpdatedAt() != null ? comment.getUpdatedAt().toString() : null)
                .build();
    }
}
