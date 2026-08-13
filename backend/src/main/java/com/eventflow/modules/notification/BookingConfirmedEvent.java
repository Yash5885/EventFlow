package com.eventflow.modules.notification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record BookingConfirmedEvent(
        UUID bookingId,
        UUID userId,
        UUID eventId,
        List<SeatPayload> seats,
        String userEmail,
        String userName,
        String eventTitle,
        LocalDateTime eventDate,
        String venueName
) {
    public record SeatPayload(
            UUID eventSeatId,
            String rowLabel,
            Integer seatNumber,
            BigDecimal price
    ) {
    }
}

