package com.eventflow.modules.venue.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record UpdateVenueRequest(
        @Size(max = 200) String name,
        String address,
        @Size(max = 100) String city,
        @Size(max = 100) String state,
        @Size(max = 10) String pincode,
        @Min(1) Integer totalCapacity,
        String description,
        Map<String, Object> layoutConfig,
        Boolean active
) {
}

