package com.smartcampus.modules.tickets.repository;

import com.smartcampus.modules.tickets.entity.Ticket;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TicketRepository extends MongoRepository<Ticket, String> {
    List<Ticket> findByCreatedBy(String userId);
    List<Ticket> findByAssignedTechnicianId(String technicianId);
    List<Ticket> findByStatus(Ticket.TicketStatus status);
    List<Ticket> findByCreatedByAndStatus(String userId, Ticket.TicketStatus status);
}
