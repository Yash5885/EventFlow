package com.eventflow.modules.event.dto;

import com.eventflow.common.enums.EventStatus;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import java.util.List;

import java.time.LocalDateTime;

public record UpdateEventRequest(
        @Size(max = 300) String title,
        String description,
        @Size(max = 100) String category,
        @Size(max = 500) String bannerUrl,
        LocalDateTime eventDate,
        LocalDateTime doorsOpenTime,
        LocalDateTime endTime,
        EventStatus status,
        Boolean publicEvent,
        @Valid List<CreateEventRequest.EventSeatPriceRequest> seatPrices
) {
}
