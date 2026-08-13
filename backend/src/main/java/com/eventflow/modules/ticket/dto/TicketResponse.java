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
        boolean isUsed
) {
    public static TicketResponse from(Ticket ticket) {
        return new TicketResponse(
                ticket.getId(),
                ticket.getBooking().getId(),
                ticket.getEventSeat().getId(),
                ticket.getTicketCode(),
                ticket.getQrCodeUrl(),
                ticket.getPdfUrl(),
                Boolean.TRUE.equals(ticket.getUsed())
        );
    }
}

