package com.eventflow.modules.venue.dto;

import com.eventflow.common.enums.SeatType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record BulkCreateSeatsRequest(
        @NotEmpty
        List<@Valid SeatCreateRequest> seats
) {
    public record SeatCreateRequest(
            @NotBlank String rowLabel,
            @NotNull @Min(1) Integer seatNumber,
            @NotNull SeatType seatType,
            Integer xPosition,
            Integer yPosition
    ) {
    }
}

