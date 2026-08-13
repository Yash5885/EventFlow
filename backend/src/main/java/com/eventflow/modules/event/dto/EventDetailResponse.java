package com.eventflow.modules.event.dto;

import com.eventflow.modules.event.Event;

public record EventDetailResponse(
        EventResponse event,
        String venueName,
        String venueAddress,
        String city,
        String state
) {
    public static EventDetailResponse from(Event event) {
        return new EventDetailResponse(
                EventResponse.from(event),
                event.getVenue().getName(),
                event.getVenue().getAddress(),
                event.getVenue().getCity(),
                event.getVenue().getState()
        );
    }
}

