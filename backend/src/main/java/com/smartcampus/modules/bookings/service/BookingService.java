package com.smartcampus.modules.bookings.service;

import com.smartcampus.common.exception.BadRequestException;
import com.smartcampus.common.exception.ConflictException;
import com.smartcampus.common.exception.ForbiddenException;
import com.smartcampus.common.exception.ResourceNotFoundException;
import com.smartcampus.modules.bookings.dto.BookingRequest;
import com.smartcampus.modules.bookings.dto.BookingResponse;
import com.smartcampus.modules.bookings.dto.BookingSuggestionResponse;
import com.smartcampus.modules.bookings.dto.ResourceAvailabilityResponse;
import com.smartcampus.modules.bookings.dto.AlternativeResourceSuggestion;
import com.smartcampus.modules.bookings.entity.Booking;
import com.smartcampus.modules.bookings.repository.BookingRepository;
import com.smartcampus.modules.notifications.service.NotificationService;
import com.smartcampus.modules.resources.entity.Resource;
import com.smartcampus.modules.resources.repository.ResourceRepository;
import com.smartcampus.modules.users.entity.User;
import com.smartcampus.modules.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public BookingResponse create(BookingRequest request, String userId) {
        // Validate resource exists
        Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        if (resource.getStatus() == Resource.ResourceStatus.OUT_OF_SERVICE) {
            throw new BadRequestException("Resource is currently out of service");
        }

        LocalDate date = LocalDate.parse(request.getDate());
        LocalTime startTime = LocalTime.parse(request.getStartTime());
        LocalTime endTime = LocalTime.parse(request.getEndTime());

        if (!endTime.isAfter(startTime)) {
            throw new BadRequestException("End time must be after start time");
        }

        // Check for overlapping bookings
        List<Booking> overlapping = bookingRepository.findOverlappingBookings(
                request.getResourceId(), date, startTime, endTime);

        if (!overlapping.isEmpty()) {
            throw new ConflictException("Time slot conflicts with an existing booking");
        }

        Booking booking = Booking.builder()
                .resourceId(request.getResourceId())
                .userId(userId)
                .date(date)
                .startTime(startTime)
                .endTime(endTime)
                .purpose(request.getPurpose())
                .expectedAttendees(request.getExpectedAttendees())
                .status(Booking.BookingStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        booking = bookingRepository.save(booking);
        return toResponse(booking);
    }

    public List<BookingResponse> getMyBookings(String userId, String status) {
        List<Booking> bookings;
        if (status != null) {
            bookings = bookingRepository.findByUserIdAndStatus(userId,
                    Booking.BookingStatus.valueOf(status.toUpperCase()));
        } else {
            bookings = bookingRepository.findByUserId(userId);
        }
        return bookings.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<BookingResponse> getAllBookings(String status, String date, String resourceId) {
        List<Booking> bookings;

        if (status != null) {
            bookings = bookingRepository.findByStatus(Booking.BookingStatus.valueOf(status.toUpperCase()));
        } else if (date != null) {
            bookings = bookingRepository.findByDate(LocalDate.parse(date));
        } else if (resourceId != null) {
            bookings = bookingRepository.findByResourceId(resourceId);
        } else {
            bookings = bookingRepository.findAll();
        }

        return bookings.stream().map(this::toResponse).collect(Collectors.toList());
    }

        public BookingSuggestionResponse getSuggestions(String resourceId,
                                String date,
                                String startTime,
                                String endTime,
                                Integer expectedAttendees) {
        Resource selectedResource = resourceRepository.findById(resourceId)
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        LocalDate requestDate = LocalDate.parse(date);
        LocalTime requestedStartTime = LocalTime.parse(startTime);
        LocalTime requestedEndTime = LocalTime.parse(endTime);

        if (!requestedEndTime.isAfter(requestedStartTime)) {
            throw new BadRequestException("End time must be after start time");
        }

        int attendees = expectedAttendees == null ? 1 : Math.max(expectedAttendees, 1);
        long durationMinutes = Duration.between(requestedStartTime, requestedEndTime).toMinutes();

        List<Booking> selectedOverlaps = bookingRepository.findOverlappingBookings(
            resourceId,
            requestDate,
            requestedStartTime,
            requestedEndTime
        );
        boolean hasConflict = !selectedOverlaps.isEmpty();

        LocalTime nextStartTime = null;
        LocalTime nextEndTime = null;

        if (hasConflict) {
            LocalTime probeStart = requestedStartTime;
            LocalTime dayLimit = LocalTime.of(23, 30);

            while (probeStart.isBefore(dayLimit)) {
            LocalTime probeEnd = probeStart.plusMinutes(durationMinutes);
            if (probeEnd.isAfter(LocalTime.MAX.minusSeconds(1))) {
                break;
            }

            List<Booking> overlaps = bookingRepository.findOverlappingBookings(
                resourceId,
                requestDate,
                probeStart,
                probeEnd
            );

            if (overlaps.isEmpty()) {
                nextStartTime = probeStart;
                nextEndTime = probeEnd;
                break;
            }

            LocalTime maxEnd = overlaps.stream()
                .map(Booking::getEndTime)
                .max(LocalTime::compareTo)
                .orElse(probeEnd);

            if (!maxEnd.isAfter(probeStart)) {
                break;
            }

            probeStart = maxEnd;
            }
        }

        List<AlternativeResourceSuggestion> alternatives = resourceRepository.findByStatus(Resource.ResourceStatus.ACTIVE)
            .stream()
            .filter(resource -> !resource.getId().equals(resourceId))
            .filter(resource -> resource.getCapacity() >= attendees)
            .filter(resource -> bookingRepository.findOverlappingBookings(
                resource.getId(),
                requestDate,
                requestedStartTime,
                requestedEndTime
            ).isEmpty())
            .sorted(Comparator.comparingInt(resource -> Math.abs(resource.getCapacity() - attendees)))
            .limit(4)
            .map(resource -> AlternativeResourceSuggestion.builder()
                .resourceId(resource.getId())
                .resourceName(resource.getName())
                .resourceType(resource.getType().name())
                .location(resource.getLocation())
                .capacity(resource.getCapacity())
                .build())
            .collect(Collectors.toList());

        String message = hasConflict
            ? "Requested slot has a conflict. Try a suggested option below."
            : "Requested slot is available. You can continue with this booking.";

        return BookingSuggestionResponse.builder()
            .hasConflict(hasConflict)
            .message(message)
            .requestedResourceId(selectedResource.getId())
            .requestedResourceName(selectedResource.getName())
            .nextAvailableStartTime(nextStartTime != null ? nextStartTime.toString() : null)
            .suggestedEndTime(nextEndTime != null ? nextEndTime.toString() : null)
            .alternatives(alternatives)
            .build();
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

        // Send notification
        notificationService.create(booking.getUserId(), "Booking Approved",
                "Your booking for " + getResourceName(booking.getResourceId()) +
                        " on " + booking.getDate() + " has been approved.");

        return toResponse(booking);
    }

    public BookingResponse reject(String bookingId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new BadRequestException("Only pending bookings can be rejected");
        }

        booking.setStatus(Booking.BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        booking.setUpdatedAt(LocalDateTime.now());
        booking = bookingRepository.save(booking);

        // Send notification
        notificationService.create(booking.getUserId(), "Booking Rejected",
                "Your booking for " + getResourceName(booking.getResourceId()) +
                        " on " + booking.getDate() + " has been rejected. Reason: " +
                        (reason != null ? reason : "No reason provided"));

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

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setUpdatedAt(LocalDateTime.now());
        booking = bookingRepository.save(booking);
        return toResponse(booking);
    }

    public List<ResourceAvailabilityResponse> getResourceAvailability() {
        LocalDateTime now = LocalDateTime.now();

        List<Booking> approvedBookings = bookingRepository.findByStatus(Booking.BookingStatus.APPROVED);
        List<Booking> pendingBookings = bookingRepository.findByStatus(Booking.BookingStatus.PENDING);

        List<Booking> relevantBookings = approvedBookings.stream()
                .filter(booking -> !LocalDateTime.of(booking.getDate(), booking.getEndTime()).isBefore(now))
                .collect(Collectors.toList());
        relevantBookings.addAll(
                pendingBookings.stream()
                        .filter(booking -> !LocalDateTime.of(booking.getDate(), booking.getEndTime()).isBefore(now))
                        .collect(Collectors.toList())
        );

        Map<String, Booking> currentlyBookedByResource = new HashMap<>();
        Map<String, Booking> nextBookingByResource = new HashMap<>();

        for (Booking booking : relevantBookings) {
            LocalDateTime startAt = LocalDateTime.of(booking.getDate(), booking.getStartTime());
            LocalDateTime endAt = LocalDateTime.of(booking.getDate(), booking.getEndTime());

            if (!now.isBefore(startAt) && now.isBefore(endAt)) {
                Booking current = currentlyBookedByResource.get(booking.getResourceId());
                if (current == null ||
                        endAt.isAfter(LocalDateTime.of(current.getDate(), current.getEndTime()))) {
                    currentlyBookedByResource.put(booking.getResourceId(), booking);
                }
                continue;
            }

            if (startAt.isAfter(now)) {
                Booking next = nextBookingByResource.get(booking.getResourceId());
                if (next == null ||
                        startAt.isBefore(LocalDateTime.of(next.getDate(), next.getStartTime()))) {
                    nextBookingByResource.put(booking.getResourceId(), booking);
                }
            }
        }

        return resourceRepository.findAll().stream()
                .map(resource -> {
                    Booking current = currentlyBookedByResource.get(resource.getId());
                    if (current != null) {
                        return ResourceAvailabilityResponse.builder()
                                .resourceId(resource.getId())
                                .status("CURRENTLY_BOOKED")
                                .availableAfter(LocalDateTime.of(current.getDate(), current.getEndTime()).toString())
                                .build();
                    }

                    Booking next = nextBookingByResource.get(resource.getId());
                    if (next != null) {
                        return ResourceAvailabilityResponse.builder()
                                .resourceId(resource.getId())
                                .status("AVAILABLE_AFTER")
                                .availableAfter(LocalDateTime.of(next.getDate(), next.getStartTime()).toString())
                                .build();
                    }

                    return ResourceAvailabilityResponse.builder()
                            .resourceId(resource.getId())
                            .status("AVAILABLE_NOW")
                            .availableAfter(null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private String getResourceName(String resourceId) {
        return resourceRepository.findById(resourceId)
                .map(Resource::getName).orElse("Unknown Resource");
    }

    private BookingResponse toResponse(Booking booking) {
        String resourceName = getResourceName(booking.getResourceId());
        String userName = userRepository.findById(booking.getUserId())
                .map(User::getFullName).orElse("Unknown User");

        return BookingResponse.builder()
                .id(booking.getId())
                .resourceId(booking.getResourceId())
                .resourceName(resourceName)
                .userId(booking.getUserId())
                .userName(userName)
                .date(booking.getDate().toString())
                .startTime(booking.getStartTime().toString())
                .endTime(booking.getEndTime().toString())
                .purpose(booking.getPurpose())
                .expectedAttendees(booking.getExpectedAttendees())
                .status(booking.getStatus().name())
                .rejectionReason(booking.getRejectionReason())
                .createdAt(booking.getCreatedAt().toString())
                .build();
    }
}
