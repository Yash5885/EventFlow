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

    record Attendance(long issued, long checkedIn) { }

    List<com.eventflow.modules.event.dto.EventSummaryResponse> gateEvents(UserPrincipal principal);

    Attendance attendance(UserPrincipal principal, UUID eventId);

    TicketVerifyResponse verify(UserPrincipal principal, UUID eventId, String ticketCode);

    byte[] download(UserPrincipal principal, UUID ticketId);
}
