package com.eventflow.modules.venue.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record CreateVenueRequest(
        @NotBlank @Size(max = 200) String name,
        @NotBlank String address,
        @NotBlank @Size(max = 100) String city,
        @NotBlank @Size(max = 100) String state,
        @Size(max = 10) String pincode,
        @NotNull @Min(1) Integer totalCapacity,
        String description,
        Map<String, Object> layoutConfig
) {
}

