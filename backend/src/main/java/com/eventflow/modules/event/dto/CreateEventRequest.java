package com.eventflow.modules.event.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CreateEventRequest(
        @NotNull UUID venueId,
        @NotBlank @Size(max = 300) String title,
        String description,
        @Size(max = 100) String category,
        @Size(max = 500) String bannerUrl,
        @NotNull LocalDateTime eventDate,
        LocalDateTime doorsOpenTime,
        LocalDateTime endTime,
        @Valid List<EventSeatPriceRequest> seatPrices
) {
    public record EventSeatPriceRequest(
            @NotNull UUID seatId,
            @NotNull @DecimalMin("0.00") BigDecimal price
    ) {
    }
}

