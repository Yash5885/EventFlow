package com.eventflow.modules.user.dto;

import com.eventflow.common.enums.UserRole;
import com.eventflow.modules.user.User;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String name,
        String email,
        UserRole role,
        boolean isEmailVerified,
        String profileImageUrl
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                Boolean.TRUE.equals(user.getEmailVerified()),
                user.getProfileImageUrl()
        );
    }
}

