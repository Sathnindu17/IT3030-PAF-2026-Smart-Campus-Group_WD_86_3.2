package com.smartcampus.modules.tickets.service;

import com.smartcampus.common.exception.BadRequestException;
import com.smartcampus.common.exception.ResourceNotFoundException;
import com.smartcampus.modules.notifications.service.NotificationService;
import com.smartcampus.modules.resources.entity.Resource;
import com.smartcampus.modules.resources.repository.ResourceRepository;
import com.smartcampus.modules.tickets.dto.TicketRequest;
import com.smartcampus.modules.tickets.dto.TicketResponse;
import com.smartcampus.modules.tickets.entity.Ticket;
import com.smartcampus.modules.tickets.repository.TicketRepository;
import com.smartcampus.modules.users.entity.User;
import com.smartcampus.modules.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public TicketResponse create(TicketRequest request, String userId) {
        // Validate attachments count
        if (request.getAttachmentUrls() != null && request.getAttachmentUrls().size() > 3) {
            throw new BadRequestException("Maximum 3 attachments allowed");
        }

        Ticket ticket = Ticket.builder()
                .title(request.getTitle())
                .category(request.getCategory())
                .description(request.getDescription())
                .priority(parsePriority(request.getPriority()))
                .preferredContact(request.getPreferredContact())
                .resourceId(request.getResourceId())
                .location(request.getLocation())
                .attachmentUrls(request.getAttachmentUrls())
                .status(Ticket.TicketStatus.OPEN)
                .createdBy(userId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        ticket = ticketRepository.save(ticket);

        try {
            notificationService.create(userId, "Ticket Created",
                    "Your ticket '" + ticket.getTitle() + "' has been created successfully.");
        } catch (Exception ex) {
            log.warn("Ticket {} created but notification could not be saved for user {}", ticket.getId(), userId, ex);
        }

        return toResponse(ticket);
    }

    public TicketResponse getById(String id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        return toResponse(ticket);
    }

    public List<TicketResponse> getMyTickets(String userId) {
        return ticketRepository.findByCreatedBy(userId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public List<TicketResponse> getAllTickets(String status) {
        List<Ticket> tickets;
        if (status != null) {
            tickets = ticketRepository.findByStatus(Ticket.TicketStatus.valueOf(status.toUpperCase()));
        } else {
            tickets = ticketRepository.findAll();
        }
        return tickets.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<TicketResponse> getAssignedTickets(String technicianId) {
        return ticketRepository.findByAssignedTechnicianId(technicianId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public TicketResponse assignTechnician(String ticketId, String technicianId, String assignedByUserId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        // Verify technician exists
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician not found"));

        if (technician.getRole() != User.Role.TECHNICIAN && technician.getRole() != User.Role.ADMIN) {
            throw new BadRequestException("User is not a technician");
        }

        ticket.setAssignedTechnicianId(technicianId);
        ticket.setStatus(Ticket.TicketStatus.IN_PROGRESS);
        ticket.setUpdatedAt(LocalDateTime.now());
        ticket = ticketRepository.save(ticket);

        // Notify technician
        notificationService.create(technicianId, "Ticket Assigned",
                "You have been assigned to ticket: " + ticket.getTitle());

        if (assignedByUserId != null && !assignedByUserId.isBlank()) {
            String technicianName = technician.getFullName() != null && !technician.getFullName().isBlank()
                ? technician.getFullName()
                : technician.getEmail();

            notificationService.create(assignedByUserId, "Technician Assigned",
                "You assigned " + technicianName + " to ticket: " + ticket.getTitle(), "TICKET");
        }

        // Notify ticket creator
        notificationService.create(ticket.getCreatedBy(), "Ticket Update",
                "A technician has been assigned to your ticket: " + ticket.getTitle());

        return toResponse(ticket);
    }

    public TicketResponse updateStatus(String ticketId, String newStatus) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        Ticket.TicketStatus status;
        try {
            status = Ticket.TicketStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status: " + newStatus);
        }

        ticket.setStatus(status);
        ticket.setUpdatedAt(LocalDateTime.now());
        ticket = ticketRepository.save(ticket);

        // Notify ticket creator
        notificationService.create(ticket.getCreatedBy(), "Ticket Status Updated",
                "Your ticket '" + ticket.getTitle() + "' status changed to " + status.name());

        return toResponse(ticket);
    }

    public TicketResponse addResolutionNotes(String ticketId, String notes) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        ticket.setResolutionNotes(notes);
        ticket.setUpdatedAt(LocalDateTime.now());
        ticket = ticketRepository.save(ticket);
        return toResponse(ticket);
    }

    public TicketResponse updateTicket(String ticketId, Map<String, String> updates, String userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        // Only allow the ticket creator to update the ticket
        if (!ticket.getCreatedBy().equals(userId)) {
            throw new BadRequestException("You can only edit your own tickets");
        }

        // Only allow updates if ticket status is OPEN
        if (ticket.getStatus() != Ticket.TicketStatus.OPEN) {
            throw new BadRequestException("Only open tickets can be edited");
        }

        // Update allowed fields
        if (updates.containsKey("title")) {
            ticket.setTitle(updates.get("title"));
        }
        if (updates.containsKey("category")) {
            ticket.setCategory(updates.get("category"));
        }
        if (updates.containsKey("description")) {
            ticket.setDescription(updates.get("description"));
        }
        if (updates.containsKey("priority")) {
            ticket.setPriority(parsePriority(updates.get("priority")));
        }
        if (updates.containsKey("preferredContact")) {
            ticket.setPreferredContact(updates.get("preferredContact"));
        }
        if (updates.containsKey("location")) {
            ticket.setLocation(updates.get("location"));
        }
        if (updates.containsKey("resourceId")) {
            String resourceId = updates.get("resourceId");
            ticket.setResourceId(resourceId.isEmpty() ? null : resourceId);
        }

        ticket.setUpdatedAt(LocalDateTime.now());
        ticket = ticketRepository.save(ticket);
        return toResponse(ticket);
    }

    public void deleteTicket(String ticketId, String userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        // Only allow the ticket creator to delete the ticket
        if (!ticket.getCreatedBy().equals(userId)) {
            throw new BadRequestException("You can only delete your own tickets");
        }

        // Only allow deletion if ticket status is OPEN
        if (ticket.getStatus() != Ticket.TicketStatus.OPEN) {
            throw new BadRequestException("Only open tickets can be deleted");
        }

        ticketRepository.deleteById(ticketId);
    }

    private Ticket.TicketPriority parsePriority(String priority) {
        try {
            return Ticket.TicketPriority.valueOf(priority.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid priority: " + priority + ". Allowed: LOW, MEDIUM, HIGH, URGENT");
        }
    }

    private TicketResponse toResponse(Ticket ticket) {
        String resourceName = null;
        if (ticket.getResourceId() != null) {
            resourceName = resourceRepository.findById(ticket.getResourceId())
                    .map(Resource::getName).orElse(null);
        }

        String createdByName = userRepository.findById(ticket.getCreatedBy())
                .map(User::getFullName).orElse("Unknown");

        String techName = null;
        if (ticket.getAssignedTechnicianId() != null) {
            techName = userRepository.findById(ticket.getAssignedTechnicianId())
                    .map(user -> {
                        String fullName = user.getFullName();
                        return (fullName != null && !fullName.trim().isEmpty()) ? fullName : user.getEmail();
                    })
                    .orElse(null);
        }

        return TicketResponse.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .category(ticket.getCategory())
                .description(ticket.getDescription())
                .priority(ticket.getPriority().name())
                .preferredContact(ticket.getPreferredContact())
                .resourceId(ticket.getResourceId())
                .resourceName(resourceName)
                .location(ticket.getLocation())
                .attachmentUrls(ticket.getAttachmentUrls())
                .assignedTechnicianId(ticket.getAssignedTechnicianId())
                .assignedTechnicianName(techName)
                .resolutionNotes(ticket.getResolutionNotes())
                .status(ticket.getStatus().name())
                .createdBy(ticket.getCreatedBy())
                .createdByName(createdByName)
                .createdAt(ticket.getCreatedAt() != null ? ticket.getCreatedAt().toString() : null)
                .updatedAt(ticket.getUpdatedAt() != null ? ticket.getUpdatedAt().toString() : null)
                .build();
    }
}
