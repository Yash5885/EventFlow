package com.eventflow.modules.venue.dto;

import com.eventflow.common.enums.SeatType;
import jakarta.validation.constraints.Min;

public record UpdateSeatRequest(
        String rowLabel,
        @Min(1) Integer seatNumber,
        SeatType seatType,
        Integer xPosition,
        Integer yPosition,
        Boolean active
) {
}

