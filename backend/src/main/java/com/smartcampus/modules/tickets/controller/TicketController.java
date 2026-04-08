package com.smartcampus.modules.tickets.controller;

import com.smartcampus.common.dto.ApiResponse;
import com.smartcampus.modules.tickets.dto.TicketRequest;
import com.smartcampus.modules.tickets.dto.TicketResponse;
import com.smartcampus.modules.tickets.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    public ResponseEntity<ApiResponse<TicketResponse>> create(@Valid @RequestBody TicketRequest request,
                                                               Authentication auth) {
        String userId = (String) auth.getPrincipal();
        TicketResponse response = ticketService.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Ticket created", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TicketResponse>> getById(@PathVariable String id) {
        TicketResponse response = ticketService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getMyTickets(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        List<TicketResponse> response = ticketService.getMyTickets(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/admin/all")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getAllTickets(
            @RequestParam(required = false) String status) {
        List<TicketResponse> response = ticketService.getAllTickets(status);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/assigned")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getAssignedTickets(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        List<TicketResponse> response = ticketService.getAssignedTickets(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<TicketResponse>> assignTechnician(
            @PathVariable String id, @RequestBody Map<String, String> body) {
        String technicianId = body.get("technicianId");
        TicketResponse response = ticketService.assignTechnician(id, technicianId);
        return ResponseEntity.ok(ApiResponse.success("Technician assigned", response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TicketResponse>> updateStatus(
            @PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        TicketResponse response = ticketService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Status updated", response));
    }

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<TicketResponse>> addResolutionNotes(
            @PathVariable String id, @RequestBody Map<String, String> body) {
        String notes = body.get("resolutionNotes");
        TicketResponse response = ticketService.addResolutionNotes(id, notes);
        return ResponseEntity.ok(ApiResponse.success("Resolution notes added", response));
    }
}
