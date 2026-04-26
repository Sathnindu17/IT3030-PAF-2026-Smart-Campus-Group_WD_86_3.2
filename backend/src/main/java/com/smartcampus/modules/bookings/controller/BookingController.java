package com.smartcampus.modules.bookings.controller;

import com.smartcampus.common.dto.ApiResponse;
import com.smartcampus.modules.bookings.dto.BookingRequest;
import com.smartcampus.modules.bookings.dto.BookingResponse;
import com.smartcampus.modules.bookings.dto.RejectRequest;
import com.smartcampus.modules.bookings.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> create(
            @Valid @RequestBody BookingRequest request,
            Authentication auth) {

        String userId = (String) auth.getPrincipal();
        BookingResponse response = bookingService.create(request, userId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Booking created", response));
    }

    @GetMapping("/check-availability")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkAvailability(
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) String resourceName,
            @RequestParam String date,
            @RequestParam String startTime,
            @RequestParam String endTime) {

        boolean available = bookingService.checkAvailability(
                resourceId,
                resourceName,
                date,
                startTime,
                endTime);

        Map<String, Object> response = new HashMap<>();
        response.put("available", available);
        response.put(
                "message",
                available
                        ? "This time slot is available"
                        : "This time slot is already booked");

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getMyBookings(
            Authentication auth,
            @RequestParam(required = false) String status) {

        String userId = (String) auth.getPrincipal();
        List<BookingResponse> response = bookingService.getMyBookings(userId, status);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/admin/all")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getAllBookings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String resourceId) {

        List<BookingResponse> response = bookingService.getAllBookings(status, date, resourceId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<BookingResponse>> approve(@PathVariable String id) {
        BookingResponse response = bookingService.approve(id);
        return ResponseEntity.ok(ApiResponse.success("Booking approved", response));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<BookingResponse>> reject(
            @PathVariable String id,
            @RequestBody RejectRequest request) {

        BookingResponse response = bookingService.reject(id, request.getReason());
        return ResponseEntity.ok(ApiResponse.success("Booking rejected", response));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingResponse>> cancel(
            @PathVariable String id,
            Authentication auth) {

        String userId = (String) auth.getPrincipal();
        BookingResponse response = bookingService.cancel(id, userId);

        return ResponseEntity.ok(ApiResponse.success("Booking cancelled", response));
    }
}