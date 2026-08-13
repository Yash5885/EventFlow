package com.eventflow.modules.event.dto;

import com.eventflow.common.enums.SeatStatus;
import com.eventflow.common.enums.SeatType;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record SeatMapResponse(
        UUID eventId,
        UUID venueId,
        String venueName,
        List<Row> rows
) {
    public record Row(
            String rowLabel,
            List<Seat> seats
    ) {
    }

    public record Seat(
            UUID eventSeatId,
            UUID seatId,
            String rowLabel,
            Integer seatNumber,
            SeatType seatType,
            BigDecimal price,
            SeatStatus status,
            Integer xPosition,
            Integer yPosition
    ) {
    }
}

