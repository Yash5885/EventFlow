package com.eventflow.modules.user.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 2, max = 100)
        String name,

        @Size(max = 15)
        String phone,

        @Size(max = 500)
        String profileImageUrl
) {
}

