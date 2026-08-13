package com.eventflow.modules.event.dto;

import com.eventflow.common.enums.EventStatus;
import com.eventflow.modules.event.Event;

import java.time.LocalDateTime;
import java.util.UUID;

public record EventResponse(
        UUID id,
        UUID organizerId,
        UUID venueId,
        String title,
        String description,
        String category,
        String bannerUrl,
        LocalDateTime eventDate,
        LocalDateTime doorsOpenTime,
        LocalDateTime endTime,
        EventStatus status,
        boolean isPublic,
        String adminNote
) {
    public static EventResponse from(Event event) {
        return new EventResponse(
                event.getId(),
                event.getOrganizer().getId(),
                event.getVenue().getId(),
                event.getTitle(),
                event.getDescription(),
                event.getCategory(),
                event.getBannerUrl(),
                event.getEventDate(),
                event.getDoorsOpenTime(),
                event.getEndTime(),
                event.getStatus(),
                Boolean.TRUE.equals(event.getPublicEvent()),
                event.getAdminNote()
        );
    }
}

