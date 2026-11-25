package com.eventflow.modules.booking.dto;

import com.eventflow.common.enums.BookingStatus;
import com.eventflow.modules.booking.Booking;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record BookingResponse(
        UUID id,
        UUID eventId,
        BookingStatus status,
        BigDecimal totalAmount,
        BigDecimal platformFee,
        LocalDateTime expiresAt,
        List<BookingSeatResponse> seats,
        String eventTitle,
        String venueName,
        LocalDateTime eventDate,
        BigDecimal amountDue,
        LocalDateTime createdAt
) {
    public static BookingResponse from(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getEvent().getId(),
                booking.getStatus(),
                booking.getTotalAmount(),
                booking.getPlatformFee(),
                booking.getExpiresAt(),
                booking.getItems().stream().map(BookingSeatResponse::from).toList(),
                booking.getEvent().getTitle(),
                booking.getEvent().getVenue().getName(),
                booking.getEvent().getEventDate(),
                booking.amountDue(),
                booking.getCreatedAt()
        );
    }
}
