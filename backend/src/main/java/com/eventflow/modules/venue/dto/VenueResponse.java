package com.eventflow.modules.venue.dto;

import com.eventflow.modules.venue.Venue;

import java.util.Map;
import java.util.UUID;

public record VenueResponse(
        UUID id,
        UUID managerId,
        String name,
        String address,
        String city,
        String state,
        String pincode,
        Integer totalCapacity,
        String description,
        String imageUrl,
        Map<String, Object> layoutConfig,
        boolean isActive
) {
    public static VenueResponse from(Venue venue) {
        return new VenueResponse(
                venue.getId(),
                venue.getManager().getId(),
                venue.getName(),
                venue.getAddress(),
                venue.getCity(),
                venue.getState(),
                venue.getPincode(),
                venue.getTotalCapacity(),
                venue.getDescription(),
                venue.getImageUrl(),
                venue.getLayoutConfig(),
                Boolean.TRUE.equals(venue.getActive())
        );
    }
}

