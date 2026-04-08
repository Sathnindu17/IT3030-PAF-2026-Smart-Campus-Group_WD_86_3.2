package com.smartcampus.modules.comments.controller;

import com.smartcampus.common.dto.ApiResponse;
import com.smartcampus.modules.comments.dto.CommentRequest;
import com.smartcampus.modules.comments.dto.CommentResponse;
import com.smartcampus.modules.comments.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<ApiResponse<CommentResponse>> create(@Valid @RequestBody CommentRequest request,
                                                                Authentication auth) {
        String userId = (String) auth.getPrincipal();
        CommentResponse response = commentService.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Comment added", response));
    }

    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getByTicket(@PathVariable String ticketId) {
        List<CommentResponse> response = commentService.getByTicketId(ticketId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CommentResponse>> update(@PathVariable String id,
                                                                @RequestBody Map<String, String> body,
                                                                Authentication auth) {
        String userId = (String) auth.getPrincipal();
        CommentResponse response = commentService.update(id, body.get("message"), userId);
        return ResponseEntity.ok(ApiResponse.success("Comment updated", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        commentService.delete(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted", null));
    }
}
