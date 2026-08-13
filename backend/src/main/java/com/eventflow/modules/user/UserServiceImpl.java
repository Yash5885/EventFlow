package com.eventflow.modules.user;

import com.eventflow.common.exception.AppException;
import com.eventflow.common.exception.ResourceNotFoundException;
import com.eventflow.modules.user.dto.ChangePasswordRequest;
import com.eventflow.modules.user.dto.UpdateProfileRequest;
import com.eventflow.modules.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getMe(UUID userId) {
        return UserResponse.from(findUser(userId));
    }

    @Override
    @Transactional
    public UserResponse updateMe(UUID userId, UpdateProfileRequest request) {
        User user = findUser(userId);
        if (StringUtils.hasText(request.name())) {
            user.setName(request.name());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone());
        }
        if (request.profileImageUrl() != null) {
            user.setProfileImageUrl(request.profileImageUrl());
        }
        return UserResponse.from(user);
    }

    @Override
    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = findUser(userId);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}

