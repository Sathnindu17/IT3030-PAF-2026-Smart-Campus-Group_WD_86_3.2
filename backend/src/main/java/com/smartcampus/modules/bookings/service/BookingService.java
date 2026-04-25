package com.smartcampus.modules.bookings.service;

import com.smartcampus.common.exception.BadRequestException;
import com.smartcampus.common.exception.ConflictException;
import com.smartcampus.common.exception.ForbiddenException;
import com.smartcampus.common.exception.ResourceNotFoundException;
import com.smartcampus.modules.bookings.dto.BookingRequest;
import com.smartcampus.modules.bookings.dto.BookingResponse;
import com.smartcampus.modules.bookings.entity.Booking;
import com.smartcampus.modules.bookings.repository.BookingRepository;
import com.smartcampus.modules.notifications.service.NotificationService;
import com.smartcampus.modules.resources.entity.Resource;
import com.smartcampus.modules.resources.repository.ResourceRepository;
import com.smartcampus.modules.users.entity.User;
import com.smartcampus.modules.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public BookingResponse create(BookingRequest request, String userId) {

        boolean hasResourceId = request.getResourceId() != null && !request.getResourceId().isBlank();

        boolean hasResourceName = request.getResourceName() != null && !request.getResourceName().isBlank();

        if (!hasResourceId && !hasResourceName) {
            throw new BadRequestException("Please select a resource or enter custom resource name");
        }

        Resource resource = null;

        if (hasResourceId) {
            resource = resourceRepository.findById(request.getResourceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

            if (resource.getStatus() == Resource.ResourceStatus.OUT_OF_SERVICE) {
                throw new BadRequestException("Resource is currently out of service");
            }
        }

        LocalDate date;
        LocalTime startTime;
        LocalTime endTime;

        try {
            date = LocalDate.parse(request.getDate());
            startTime = LocalTime.parse(request.getStartTime());
            endTime = LocalTime.parse(request.getEndTime());
        } catch (Exception e) {
            throw new BadRequestException("Invalid date or time format");
        }

        if (date.isBefore(LocalDate.now())) {
            throw new BadRequestException("Booking date cannot be in the past");
        }

        if (!endTime.isAfter(startTime)) {
            throw new BadRequestException("End time must be after start time");
        }

        if (request.getPurpose() == null || request.getPurpose().isBlank()) {
            throw new BadRequestException("Purpose is required");
        }

        if (request.getExpectedAttendees() == null || request.getExpectedAttendees() < 1) {
            throw new BadRequestException("Expected attendees must be at least 1");
        }

        if (hasResourceId) {
            List<Booking> overlapping = bookingRepository.findOverlappingBookings(
                    request.getResourceId(),
                    date,
                    startTime,
                    endTime);

            if (!overlapping.isEmpty()) {
                throw new ConflictException("Time slot conflicts with an existing booking");
            }
        }

        String finalResourceName = hasResourceId
                ? resource.getName()
                : request.getResourceName().trim();

        Booking booking = Booking.builder()
                .resourceId(hasResourceId ? request.getResourceId() : null)
                .resourceName(finalResourceName)
                .userId(userId)
                .date(date)
                .startTime(startTime)
                .endTime(endTime)
                .purpose(request.getPurpose().trim())
                .expectedAttendees(request.getExpectedAttendees())
                .status(Booking.BookingStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        booking = bookingRepository.save(booking);

        try {
            notificationService.create(
                    userId,
                    "Booking Created",
                    "Your booking request for " + finalResourceName +
                            " on " + date + " has been submitted.");
        } catch (Exception ignored) {
            // Do not fail booking creation if notification creation fails
        }

        return toResponse(booking);
    }

    public List<BookingResponse> getMyBookings(String userId, String status) {
        List<Booking> bookings;

        if (status != null && !status.isBlank()) {
            try {
                bookings = bookingRepository.findByUserIdAndStatus(
                        userId,
                        Booking.BookingStatus.valueOf(status.toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid booking status");
            }
        } else {
            bookings = bookingRepository.findByUserId(userId);
        }

        return bookings.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<BookingResponse> getAllBookings(String status, String date, String resourceId) {
        List<Booking> bookings;

        if (status != null && !status.isBlank()) {
            try {
                bookings = bookingRepository.findByStatus(
                        Booking.BookingStatus.valueOf(status.toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid booking status");
            }
        } else if (date != null && !date.isBlank()) {
            try {
                bookings = bookingRepository.findByDate(LocalDate.parse(date));
            } catch (Exception e) {
                throw new BadRequestException("Invalid date format");
            }
        } else if (resourceId != null && !resourceId.isBlank()) {
            bookings = bookingRepository.findByResourceId(resourceId);
        } else {
            bookings = bookingRepository.findAll();
        }

        return bookings.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public BookingResponse approve(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new BadRequestException("Only pending bookings can be approved");
        }

        booking.setStatus(Booking.BookingStatus.APPROVED);
        booking.setUpdatedAt(LocalDateTime.now());

        booking = bookingRepository.save(booking);

        try {
            notificationService.create(
                    booking.getUserId(),
                    "Booking Approved",
                    "Your booking for " + getResourceName(booking) +
                            " on " + booking.getDate() + " has been approved.");
        } catch (Exception ignored) {
        }

        return toResponse(booking);
    }

    public BookingResponse reject(String bookingId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new BadRequestException("Only pending bookings can be rejected");
        }

        booking.setStatus(Booking.BookingStatus.REJECTED);
        booking.setRejectionReason(
                reason != null && !reason.isBlank() ? reason.trim() : "No reason provided");
        booking.setUpdatedAt(LocalDateTime.now());

        booking = bookingRepository.save(booking);

        try {
            notificationService.create(
                    booking.getUserId(),
                    "Booking Rejected",
                    "Your booking for " + getResourceName(booking) +
                            " on " + booking.getDate() +
                            " has been rejected. Reason: " + booking.getRejectionReason());
        } catch (Exception ignored) {
        }

        return toResponse(booking);
    }

    public BookingResponse cancel(String bookingId, String userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!booking.getUserId().equals(userId)) {
            throw new ForbiddenException("You can only cancel your own bookings");
        }

        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking is already cancelled");
        }

        if (booking.getStatus() == Booking.BookingStatus.REJECTED) {
            throw new BadRequestException("Rejected bookings cannot be cancelled");
        }

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setUpdatedAt(LocalDateTime.now());

        booking = bookingRepository.save(booking);

        try {
            notificationService.create(
                    booking.getUserId(),
                    "Booking Cancelled",
                    "Your booking for " + getResourceName(booking) +
                            " on " + booking.getDate() + " has been cancelled.");
        } catch (Exception ignored) {
        }

        return toResponse(booking);
    }

    private String getResourceName(Booking booking) {
        if (booking.getResourceName() != null && !booking.getResourceName().isBlank()) {
            return booking.getResourceName();
        }

        if (booking.getResourceId() == null || booking.getResourceId().isBlank()) {
            return "Custom Resource";
        }

        return resourceRepository.findById(booking.getResourceId())
                .map(Resource::getName)
                .orElse("Unknown Resource");
    }

    private BookingResponse toResponse(Booking booking) {
        String userName = userRepository.findById(booking.getUserId())
                .map(User::getFullName)
                .orElse("Unknown User");

        return BookingResponse.builder()
                .id(booking.getId())
                .resourceId(booking.getResourceId())
                .resourceName(getResourceName(booking))
                .userId(booking.getUserId())
                .userName(userName)
                .date(booking.getDate() != null ? booking.getDate().toString() : null)
                .startTime(booking.getStartTime() != null ? booking.getStartTime().toString() : null)
                .endTime(booking.getEndTime() != null ? booking.getEndTime().toString() : null)
                .purpose(booking.getPurpose())
                .expectedAttendees(booking.getExpectedAttendees())
                .status(booking.getStatus() != null ? booking.getStatus().name() : null)
                .rejectionReason(booking.getRejectionReason())
                .createdAt(booking.getCreatedAt() != null ? booking.getCreatedAt().toString() : null)
                .build();
    }
}