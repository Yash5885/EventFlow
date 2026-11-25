package com.eventflow.modules.ticket.dto;

import com.eventflow.modules.ticket.Ticket;

import java.util.UUID;

public record TicketResponse(
        UUID id,
        UUID bookingId,
        UUID eventSeatId,
        String ticketCode,
        String qrCodeUrl,
        String pdfUrl,
        boolean isUsed,
        String eventTitle,
        String seatLabel
) {
    public static TicketResponse from(Ticket ticket) {
        return new TicketResponse(
                ticket.getId(),
                ticket.getBooking().getId(),
                ticket.getEventSeat().getId(),
                ticket.getTicketCode(),
                ticket.getQrCodeUrl(),
                "/api/v1/tickets/" + ticket.getId() + "/download",
                Boolean.TRUE.equals(ticket.getUsed()),
                ticket.getBooking().getEvent().getTitle(),
                ticket.getEventSeat().getSeat().getRowLabel() + ticket.getEventSeat().getSeat().getSeatNumber()
        );
    }
}
