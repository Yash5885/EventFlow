package com.eventflow.modules.ticket;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    List<Ticket> findByBooking_Id(UUID bookingId);

    Page<Ticket> findByBooking_User_Id(UUID userId, Pageable pageable);

    Optional<Ticket> findByTicketCode(String ticketCode);
}
