package com.eventflow.modules.ticket;

import com.eventflow.common.PageResponse;
import com.eventflow.common.enums.BookingStatus;
import com.eventflow.common.enums.UserRole;
import com.eventflow.common.exception.AppException;
import org.springframework.http.HttpStatus;
import com.eventflow.common.exception.ResourceNotFoundException;
import com.eventflow.modules.booking.Booking;
import com.eventflow.modules.booking.BookingRepository;
import com.eventflow.modules.event.Event;
import com.eventflow.modules.event.EventRepository;
import com.eventflow.modules.event.dto.EventSummaryResponse;
import com.eventflow.common.enums.EventStatus;
import com.eventflow.modules.event.EventSeat;
import com.eventflow.modules.event.EventSeatRepository;
import com.eventflow.modules.notification.BookingConfirmedEvent;
import com.eventflow.modules.ticket.dto.TicketResponse;
import com.eventflow.modules.ticket.dto.TicketVerifyResponse;
import com.eventflow.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final TicketRepository ticketRepository;
    private final BookingRepository bookingRepository;
    private final EventSeatRepository eventSeatRepository;

    private final TicketPdf ticketPdf;
    private final EventRepository events;
    private final com.eventflow.modules.refund.RefundRepository refunds;

    @Override
    @Transactional
    public void generateTicketsForBooking(BookingConfirmedEvent event) {
        Booking booking = bookingRepository.findById(event.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        if (booking.getStatus() != BookingStatus.CONFIRMED || !ticketRepository.findByBooking_Id(booking.getId()).isEmpty()) {
            return;
        }
        event.seats().forEach(seatPayload -> {
            EventSeat eventSeat = eventSeatRepository.findById(seatPayload.eventSeatId())
                    .orElseThrow(() -> new ResourceNotFoundException("Event seat not found"));
            String ticketCode = "EF-%s-%s".formatted(event.eventId().toString().substring(0, 4).toUpperCase(), randomCode());
            Ticket ticket = Ticket.builder()
                    .booking(booking)
                    .eventSeat(eventSeat)
                    .ticketCode(ticketCode)
                    .build();
            ticketRepository.save(ticket);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> byBooking(UserPrincipal principal, UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        requireOwner(principal, booking);
        return booking.getStatus() == BookingStatus.CONFIRMED
                ? ticketRepository.findByBooking_Id(bookingId).stream()
                        .filter(ticket -> principal.role() == UserRole.ADMIN || ticket.currentHolder().getId().equals(principal.id()))
                        .map(TicketResponse::from).toList() : List.of();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TicketResponse> myTickets(UserPrincipal principal, Pageable pageable) {
        return PageResponse.from(ticketRepository.findForHolder(principal.id(), BookingStatus.CONFIRMED, pageable).map(TicketResponse::from));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventSummaryResponse> gateEvents(UserPrincipal principal) {
        var visible = principal.role() == UserRole.ADMIN
                ? events.findByStatusAndPublicEventTrue(EventStatus.PUBLISHED, org.springframework.data.domain.PageRequest.of(0, 100)).getContent()
                : events.findTop100ByVenue_Manager_IdAndStatusOrderByEventDateAsc(principal.id(), EventStatus.PUBLISHED);
        return visible.stream().map(EventSummaryResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Attendance attendance(UserPrincipal principal, UUID eventId) {
        requireGateEvent(principal, eventId);
        return new Attendance(ticketRepository.countByBooking_Event_IdAndBooking_Status(eventId, BookingStatus.CONFIRMED),
                ticketRepository.countByBooking_Event_IdAndBooking_StatusAndUsedTrue(eventId, BookingStatus.CONFIRMED));
    }

    @Override
    @Transactional
    public TicketVerifyResponse verify(UserPrincipal principal, UUID eventId, String ticketCode) {
        requireGateEvent(principal, eventId);
        String code = ticketCode.trim().toUpperCase(java.util.Locale.ROOT);
        var ticket = ticketRepository.lockByCode(code).orElse(null);
        if (ticket == null) return rejected(code, "INVALID", "Ticket code was not found");
        var booking = ticket.getBooking();
        if (!eventId.equals(booking.getEvent().getId())) return rejected(code, "WRONG_EVENT", "Ticket belongs to a different event");
        if (booking.getStatus() != BookingStatus.CONFIRMED ||
                refunds.existsByBooking_IdAndStatusIn(booking.getId(), List.of(com.eventflow.modules.refund.RefundRequest.Status.APPROVED))) {
            return rejected(code, "INVALID", "Ticket is inactive or its refund is processing");
        }
        var seat = ticket.getEventSeat().getSeat();
        boolean used = Boolean.TRUE.equals(ticket.getUsed());
        if (!used) {
            ticket.setUsed(true);
            ticket.setUsedAt(LocalDateTime.now());
        }
        return new TicketVerifyResponse(code, booking.getEvent().getTitle(), seat.getRowLabel() + "-" + seat.getSeatNumber(),
                ticket.currentHolder().getName(), !used, used, ticket.getUsedAt(),
                used ? "Already checked in" : "Admission accepted", used ? "ALREADY_USED" : "ACCEPTED");
    }

    private Event requireGateEvent(UserPrincipal principal, UUID eventId) {
        var event = events.findById(eventId).orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        if (principal.role() != UserRole.ADMIN &&
                (principal.role() != UserRole.VENUE_MANAGER || !event.getVenue().getManager().getId().equals(principal.id()))) {
            throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "This venue is assigned to a different manager");
        }
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new AppException(HttpStatus.CONFLICT, "INACTIVE_EVENT", "Check-in is available for published events");
        }
        return event;
    }

    private TicketVerifyResponse rejected(String code, String result, String message) {
        return new TicketVerifyResponse(code, null, null, null, false, false, null, message, result);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] download(UserPrincipal principal, UUID ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        if (principal.role() != UserRole.ADMIN && !ticket.currentHolder().getId().equals(principal.id())) {
            throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Ticket access denied");
        }
        if (ticket.getBooking().getStatus() != BookingStatus.CONFIRMED) {
            throw new ResourceNotFoundException("Ticket is unavailable");
        }
        return ticketPdf.render(ticket);
    }

    private void requireOwner(UserPrincipal principal, Booking booking) {
        if (principal.role() != UserRole.ADMIN && !booking.getUser().getId().equals(principal.id())) {
            throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Ticket access denied");
        }
    }

    private String randomCode() {
        StringBuilder builder = new StringBuilder(12);
        for (int index = 0; index < 12; index++) {
            builder.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return builder.toString();
    }
}
