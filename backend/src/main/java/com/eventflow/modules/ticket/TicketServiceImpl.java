package com.eventflow.modules.ticket;

import com.eventflow.common.PageResponse;
import com.eventflow.common.exception.ResourceNotFoundException;
import com.eventflow.modules.booking.Booking;
import com.eventflow.modules.booking.BookingRepository;
import com.eventflow.modules.event.EventSeat;
import com.eventflow.modules.event.EventSeatRepository;
import com.eventflow.modules.notification.BookingConfirmedEvent;
import com.eventflow.modules.ticket.dto.TicketResponse;
import com.eventflow.modules.ticket.dto.TicketVerifyResponse;
import com.eventflow.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.aws.s3.bucket-name}")
    private String bucketName;

    @Override
    @Transactional
    public void generateTicketsForBooking(BookingConfirmedEvent event) {
        Booking booking = bookingRepository.findById(event.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        if (!ticketRepository.findByBooking_Id(booking.getId()).isEmpty()) {
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
                    .qrCodeUrl("s3://%s/qr/%s.png".formatted(bucketName, ticketCode))
                    .pdfUrl("s3://%s/tickets/%s.pdf".formatted(bucketName, ticketCode))
                    .build();
            ticketRepository.save(ticket);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> byBooking(UserPrincipal principal, UUID bookingId) {
        return ticketRepository.findByBooking_Id(bookingId).stream().map(TicketResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TicketResponse> myTickets(UserPrincipal principal, Pageable pageable) {
        return PageResponse.from(ticketRepository.findByBooking_User_Id(principal.id(), pageable).map(TicketResponse::from));
    }

    @Override
    @Transactional
    public TicketVerifyResponse verify(String ticketCode) {
        Ticket ticket = ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        if (!Boolean.TRUE.equals(ticket.getUsed())) {
            ticket.setUsed(true);
            ticket.setUsedAt(LocalDateTime.now());
        }
        var booking = ticket.getBooking();
        var event = booking.getEvent();
        var seat = ticket.getEventSeat().getSeat();
        return new TicketVerifyResponse(
                ticket.getTicketCode(),
                event.getTitle(),
                seat.getRowLabel() + "-" + seat.getSeatNumber(),
                booking.getUser().getName(),
                true,
                Boolean.TRUE.equals(ticket.getUsed()),
                ticket.getUsedAt(),
                "Ticket verified"
        );
    }

    @Override
    @Transactional(readOnly = true)
    public String downloadUrl(UserPrincipal principal, UUID ticketId) {
        return ticketRepository.findById(ticketId)
                .map(Ticket::getPdfUrl)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
    }

    private String randomCode() {
        StringBuilder builder = new StringBuilder(6);
        for (int index = 0; index < 6; index++) {
            builder.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return builder.toString();
    }
}
