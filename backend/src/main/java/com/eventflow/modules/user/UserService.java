package com.eventflow.modules.user;

import com.eventflow.modules.user.dto.ChangePasswordRequest;
import com.eventflow.modules.user.dto.UpdateProfileRequest;
import com.eventflow.modules.user.dto.UserResponse;

import java.util.UUID;

public interface UserService {
    UserResponse getMe(UUID userId);

    UserResponse updateMe(UUID userId, UpdateProfileRequest request);

    void changePassword(UUID userId, ChangePasswordRequest request);
}

