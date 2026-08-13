package com.eventflow.modules.ticket;

import com.eventflow.common.PageResponse;
import com.eventflow.modules.notification.BookingConfirmedEvent;
import com.eventflow.modules.ticket.dto.TicketResponse;
import com.eventflow.modules.ticket.dto.TicketVerifyResponse;
import com.eventflow.security.UserPrincipal;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface TicketService {
    void generateTicketsForBooking(BookingConfirmedEvent event);

    List<TicketResponse> byBooking(UserPrincipal principal, UUID bookingId);

    PageResponse<TicketResponse> myTickets(UserPrincipal principal, Pageable pageable);

    TicketVerifyResponse verify(String ticketCode);

    String downloadUrl(UserPrincipal principal, UUID ticketId);
}

