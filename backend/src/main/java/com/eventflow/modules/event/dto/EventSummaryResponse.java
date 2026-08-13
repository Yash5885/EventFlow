package com.eventflow.modules.event.dto;

import com.eventflow.common.enums.EventStatus;
import com.eventflow.modules.event.Event;

import java.time.LocalDateTime;
import java.util.UUID;

public record EventSummaryResponse(
        UUID id,
        String title,
        String category,
        String bannerUrl,
        LocalDateTime eventDate,
        EventStatus status,
        UUID venueId,
        String venueName,
        String city
) {
    public static EventSummaryResponse from(Event event) {
        return new EventSummaryResponse(
                event.getId(),
                event.getTitle(),
                event.getCategory(),
                event.getBannerUrl(),
                event.getEventDate(),
                event.getStatus(),
                event.getVenue().getId(),
                event.getVenue().getName(),
                event.getVenue().getCity()
        );
    }
}

