package com.eventflow.modules.venue.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record VenueDetailResponse(
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
        boolean isActive,
        List<SeatResponse> seats
) {
    public static VenueDetailResponse from(VenueResponse venue, List<SeatResponse> seats) {
        return new VenueDetailResponse(
                venue.id(),
                venue.managerId(),
                venue.name(),
                venue.address(),
                venue.city(),
                venue.state(),
                venue.pincode(),
                venue.totalCapacity(),
                venue.description(),
                venue.imageUrl(),
                venue.layoutConfig(),
                venue.isActive(),
                seats
        );
    }
}

