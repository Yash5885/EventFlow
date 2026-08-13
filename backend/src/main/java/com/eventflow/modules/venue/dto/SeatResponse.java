package com.eventflow.modules.venue.dto;

import com.eventflow.common.enums.SeatType;
import com.eventflow.modules.venue.Seat;

import java.util.UUID;

public record SeatResponse(
        UUID id,
        String rowLabel,
        Integer seatNumber,
        SeatType seatType,
        Integer xPosition,
        Integer yPosition,
        boolean isActive
) {
    public static SeatResponse from(Seat seat) {
        return new SeatResponse(
                seat.getId(),
                seat.getRowLabel(),
                seat.getSeatNumber(),
                seat.getSeatType(),
                seat.getXPosition(),
                seat.getYPosition(),
                Boolean.TRUE.equals(seat.getActive())
        );
    }
}

