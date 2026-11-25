package com.eventflow.modules.auth;

import com.eventflow.common.enums.UserRole;
import com.eventflow.common.exception.AppException;
import com.eventflow.common.exception.ResourceNotFoundException;
import com.eventflow.modules.auth.dto.AuthResponse;
import com.eventflow.modules.auth.dto.ForgotPasswordRequest;
import com.eventflow.modules.auth.dto.LoginRequest;
import com.eventflow.modules.auth.dto.RefreshTokenRequest;
import com.eventflow.modules.auth.dto.RegisterRequest;
import com.eventflow.modules.auth.dto.ResetPasswordRequest;
import com.eventflow.modules.user.User;
import com.eventflow.modules.user.UserRepository;
import com.eventflow.modules.user.dto.UserResponse;
import com.eventflow.security.CustomUserDetailsService;
import com.eventflow.security.JwtTokenProvider;
import com.eventflow.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;

    @org.springframework.beans.factory.annotation.Value("${app.auth.allow-role-registration:false}")
    private boolean enableRoleRegistration;

    private final org.springframework.core.env.Environment environment;

    public boolean allowRoleRegistration() {
        return enableRoleRegistration && environment.matchesProfiles("dev");
    }

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (request.role() != null && request.role() != UserRole.CUSTOMER && !allowRoleRegistration()) {
            throw new AppException(HttpStatus.FORBIDDEN, "ROLE_RESTRICTED", "Staff accounts must be provisioned by your administrator");
        }
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new AppException(HttpStatus.CONFLICT, "RESOURCE_CONFLICT", "Email is already registered");
        }

        User user = User.builder()
                .name(request.name())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(request.role() == null ? UserRole.CUSTOMER : request.role())
                .emailVerifyToken(UUID.randomUUID().toString())
                .build();

        return UserResponse.from(userRepository.save(user));
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizeEmail(request.email()), request.password())
        );
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.id())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return tokenResponse(UserPrincipal.from(user), user);
    }

    @Override
    public AuthResponse refresh(RefreshTokenRequest request) {
        if (!jwtTokenProvider.isRefreshTokenValid(request.refreshToken())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Invalid refresh token");
        }

        UUID userId = jwtTokenProvider.getUserIdFromToken(request.refreshToken());
        jwtTokenProvider.revokeRefreshToken(userId);
        UserPrincipal principal = userDetailsService.loadUserById(userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return tokenResponse(principal, user);
    }

    @Override
    public void logout(UUID userId) {
        jwtTokenProvider.revokeRefreshToken(userId);
    }

    @Override
    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByEmailVerifyToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Verification token not found"));
        user.setEmailVerified(true);
        user.setEmailVerifyToken(null);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(normalizeEmail(request.email())).ifPresent(user -> {
            user.setPasswordResetToken(UUID.randomUUID().toString());
            user.setPasswordResetExpiresAt(LocalDateTime.now().plusHours(1));
        });
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByPasswordResetToken(request.token())
                .filter(candidate -> candidate.getPasswordResetExpiresAt() != null && candidate.getPasswordResetExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid or expired reset token"));
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiresAt(null);
    }

    private AuthResponse tokenResponse(UserPrincipal principal, User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(principal);
        String refreshToken = jwtTokenProvider.generateRefreshToken(principal);
        return AuthResponse.bearer(accessToken, refreshToken, jwtTokenProvider.accessExpirationSeconds(), UserResponse.from(user));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
