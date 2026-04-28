package com.smartcampus.modules.resources.service;

import com.smartcampus.common.exception.BadRequestException;
import com.smartcampus.common.exception.ResourceNotFoundException;
import com.smartcampus.modules.bookings.repository.BookingRepository;
import com.smartcampus.modules.resources.dto.ResourceMapAvailabilityResponse;
import com.smartcampus.modules.resources.dto.ResourceRequest;
import com.smartcampus.modules.resources.dto.ResourceRecommendationResponse;
import com.smartcampus.modules.resources.dto.ResourceResponse;
import com.smartcampus.modules.resources.entity.Resource;
import com.smartcampus.modules.resources.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private static final List<String> KNOWN_SLIIT_LOCATION_KEYWORDS = List.of(
            "a block", "block a",
            "b block", "block b",
            "c block", "block c",
            "d block", "block d",
            "e block", "block e",
            "f block", "block f",
            "g block", "block g",
            "h block", "block h",
            "new building", "new block",
            "library",
            "main building", "main hall", "auditorium",
            "lab complex", "labs",
            "car park", "parking"
    );

    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;

    public ResourceResponse create(ResourceRequest request) {
        Resource resource = Resource.builder()
                .name(request.getName())
                .type(parseType(request.getType()))
                .capacity(request.getCapacity())
                .location(validateCampusLocation(request.getLocation()))
                .status(parseStatus(request.getStatus()))
                .description(request.getDescription())
                .equipment(cleanEquipment(request.getEquipment()))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        resource = resourceRepository.save(resource);
        return toResponse(resource);
    }

    public ResourceResponse update(String id, ResourceRequest request) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));

        resource.setName(request.getName());
        resource.setType(parseType(request.getType()));
        resource.setCapacity(request.getCapacity());
        resource.setLocation(validateCampusLocation(request.getLocation()));
        resource.setStatus(parseStatus(request.getStatus()));
        resource.setDescription(request.getDescription());
        resource.setEquipment(cleanEquipment(request.getEquipment()));
        resource.setUpdatedAt(LocalDateTime.now());

        resource = resourceRepository.save(resource);
        return toResponse(resource);
    }

    public void delete(String id) {
        if (!resourceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Resource not found with id: " + id);
        }
        resourceRepository.deleteById(id);
    }

    public ResourceResponse getById(String id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));
        return toResponse(resource);
    }

    public List<ResourceResponse> getAll(String type, String status, String location, Integer minCapacity) {
        List<Resource> resources;

        if (type != null && status != null) {
            resources = resourceRepository.findByTypeAndStatus(parseType(type), parseStatus(status));
        } else if (type != null) {
            resources = resourceRepository.findByType(parseType(type));
        } else if (status != null) {
            resources = resourceRepository.findByStatus(parseStatus(status));
        } else if (location != null) {
            resources = resourceRepository.findByLocation(location);
        } else if (minCapacity != null) {
            resources = resourceRepository.findByCapacityGreaterThanEqual(minCapacity);
        } else {
            resources = resourceRepository.findAll();
        }

        return resources.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ResourceMapAvailabilityResponse> getMapAvailability(String date, String startTime, String endTime) {
        if (date == null || startTime == null || endTime == null) {
            throw new BadRequestException("date, startTime and endTime are required");
        }

        LocalDate targetDate;
        LocalTime targetStart;
        LocalTime targetEnd;
        try {
            targetDate = LocalDate.parse(date);
            targetStart = LocalTime.parse(startTime);
            targetEnd = LocalTime.parse(endTime);
        } catch (DateTimeParseException ex) {
            throw new BadRequestException("Invalid date/time format. Use date=yyyy-MM-dd and time=HH:mm");
        }

        if (!targetEnd.isAfter(targetStart)) {
            throw new BadRequestException("End time must be after start time");
        }

        return resourceRepository.findAll().stream()
                .map(resource -> ResourceMapAvailabilityResponse.builder()
                        .resourceId(resource.getId())
                        .available(isAvailable(resource.getId(), targetDate, targetStart, targetEnd))
                        .build())
                .collect(Collectors.toList());
    }

    public List<ResourceRecommendationResponse> recommend(Integer attendees,
                                                          String type,
                                                          String requiredEquipment,
                                                          String preferredLocation,
                                                          String date,
                                                          String startTime,
                                                          String endTime) {
        if (attendees == null || attendees < 1) {
            throw new BadRequestException("Attendees must be at least 1");
        }

        boolean hasAnyTimeParam = date != null || startTime != null || endTime != null;
        boolean hasAllTimeParams = date != null && startTime != null && endTime != null;
        if (hasAnyTimeParam && !hasAllTimeParams) {
            throw new BadRequestException("date, startTime and endTime must be provided together for availability checks");
        }

        LocalDate targetDate = null;
        LocalTime targetStart = null;
        LocalTime targetEnd = null;
        if (hasAllTimeParams) {
            try {
                targetDate = LocalDate.parse(date);
                targetStart = LocalTime.parse(startTime);
                targetEnd = LocalTime.parse(endTime);
            } catch (DateTimeParseException ex) {
                throw new BadRequestException("Invalid date/time format. Use date=yyyy-MM-dd and time=HH:mm");
            }

            if (!targetEnd.isAfter(targetStart)) {
                throw new BadRequestException("End time must be after start time");
            }
        }

        Resource.ResourceType requestedType = null;
        if (type != null && !type.isBlank()) {
            requestedType = parseType(type);
        }

        List<String> requiredEquipmentList = Arrays.stream(
                        requiredEquipment == null ? new String[0] : requiredEquipment.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> s.toLowerCase(Locale.ROOT))
                .toList();

        final LocalDate finalDate = targetDate;
        final LocalTime finalStart = targetStart;
        final LocalTime finalEnd = targetEnd;
        final Resource.ResourceType finalRequestedType = requestedType;

        return resourceRepository.findAll().stream()
                .filter(resource -> resource.getStatus() == Resource.ResourceStatus.ACTIVE)
                .filter(resource -> resource.getCapacity() >= attendees)
                .filter(resource -> finalRequestedType == null || resource.getType() == finalRequestedType)
                .filter(resource -> hasRequiredEquipment(resource.getEquipment(), requiredEquipmentList))
                .filter(resource -> isAvailable(resource.getId(), finalDate, finalStart, finalEnd))
                .map(resource -> toRecommendation(resource, attendees, requiredEquipmentList, preferredLocation))
                .sorted(Comparator.comparingInt(ResourceRecommendationResponse::getScore).reversed())
                .limit(5)
                .collect(Collectors.toList());
    }

    private Resource.ResourceType parseType(String type) {
        try {
            return Resource.ResourceType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid type: " + type + ". Allowed: LECTURE_HALL, LAB, MEETING_ROOM, EXAM_HALL, AUDITORIUM");
        }
    }

    private Resource.ResourceStatus parseStatus(String status) {
        try {
            return Resource.ResourceStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status: " + status + ". Allowed: ACTIVE, UNDER_RENOVATION, OUT_OF_SERVICE");
        }
    }

    private ResourceResponse toResponse(Resource resource) {
        return ResourceResponse.builder()
                .id(resource.getId())
                .name(resource.getName())
                .type(resource.getType().name())
                .capacity(resource.getCapacity())
                .location(resource.getLocation())
                .status(resource.getStatus().name())
                .description(resource.getDescription())
                .equipment(resource.getEquipment())
                .build();
    }

    private List<String> cleanEquipment(List<String> equipment) {
        if (equipment == null) {
            return Collections.emptyList();
        }
        return equipment.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .collect(Collectors.toList());
    }

    private boolean hasRequiredEquipment(List<String> resourceEquipment, List<String> requiredEquipment) {
        if (requiredEquipment == null || requiredEquipment.isEmpty()) {
            return true;
        }
        if (resourceEquipment == null || resourceEquipment.isEmpty()) {
            return false;
        }

        List<String> normalized = resourceEquipment.stream()
                .map(item -> item.toLowerCase(Locale.ROOT))
                .collect(Collectors.toList());

        return requiredEquipment.stream().allMatch(required ->
                normalized.stream().anyMatch(eq -> eq.contains(required)));
    }

    private boolean isAvailable(String resourceId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        if (date == null || startTime == null || endTime == null) {
            return true;
        }
        return bookingRepository.findOverlappingBookings(resourceId, date, startTime, endTime).isEmpty();
    }

    private ResourceRecommendationResponse toRecommendation(Resource resource,
                                                            int attendees,
                                                            List<String> requiredEquipment,
                                                            String preferredLocation) {
        int capacityDelta = Math.abs(resource.getCapacity() - attendees);
        int equipmentMatches = countEquipmentMatches(resource.getEquipment(), requiredEquipment);
        int locationBonus = locationScore(resource.getLocation(), preferredLocation);
        int score = 100 - Math.min(capacityDelta, 60) + (equipmentMatches * 10) + locationBonus;

        String reason = "Capacity fit: " + resource.getCapacity() + " for " + attendees + " attendees";
        if (equipmentMatches > 0) {
            reason += ", equipment matched: " + equipmentMatches;
        }
        if (locationBonus > 0) {
            reason += ", location match";
        }

        return ResourceRecommendationResponse.builder()
                .resourceId(resource.getId())
                .resourceName(resource.getName())
                .resourceType(resource.getType().name())
                .capacity(resource.getCapacity())
                .location(resource.getLocation())
                .equipment(resource.getEquipment())
                .score(score)
                .reason(reason)
                .build();
    }

    private int countEquipmentMatches(List<String> resourceEquipment, List<String> requiredEquipment) {
        if (requiredEquipment == null || requiredEquipment.isEmpty() || resourceEquipment == null) {
            return 0;
        }

        List<String> normalized = resourceEquipment.stream()
                .map(item -> item.toLowerCase(Locale.ROOT))
                .collect(Collectors.toList());

        return (int) requiredEquipment.stream()
                .filter(required -> normalized.stream().anyMatch(eq -> eq.contains(required)))
                .count();
    }

    private int locationScore(String location, String preferredLocation) {
        if (preferredLocation == null || preferredLocation.isBlank() || location == null) {
            return 0;
        }

        String candidate = location.toLowerCase(Locale.ROOT);
        String preferred = preferredLocation.toLowerCase(Locale.ROOT).trim();

        if (candidate.equals(preferred)) {
            return 20;
        }
        if (candidate.contains(preferred) || preferred.contains(candidate)) {
            return 12;
        }
        return 0;
    }

    private String validateCampusLocation(String location) {
        if (location == null || location.isBlank()) {
            throw new BadRequestException("Location is required");
        }

        String normalized = location.toLowerCase(Locale.ROOT).trim();
        boolean known = KNOWN_SLIIT_LOCATION_KEYWORDS.stream().anyMatch(normalized::contains);

        if (!known) {
            throw new BadRequestException(
                    "Location must include a known SLIIT campus place (e.g. Main Building, Auditorium, Library, New Building, Lab Complex)."
            );
        }

        return location.trim();
    }
}
