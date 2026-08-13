package com.eventflow.modules.auth;

import com.eventflow.modules.auth.dto.AuthResponse;
import com.eventflow.modules.auth.dto.ForgotPasswordRequest;
import com.eventflow.modules.auth.dto.LoginRequest;
import com.eventflow.modules.auth.dto.RefreshTokenRequest;
import com.eventflow.modules.auth.dto.RegisterRequest;
import com.eventflow.modules.auth.dto.ResetPasswordRequest;
import com.eventflow.modules.user.dto.UserResponse;

import java.util.UUID;

public interface AuthService {
    UserResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refresh(RefreshTokenRequest request);

    void logout(UUID userId);

    void verifyEmail(String token);

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);
}

