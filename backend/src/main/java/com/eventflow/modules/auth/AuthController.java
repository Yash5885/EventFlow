package com.eventflow.modules.auth;

import com.eventflow.common.ApiResponse;
import com.eventflow.modules.auth.dto.AuthResponse;
import com.eventflow.modules.auth.dto.ForgotPasswordRequest;
import com.eventflow.modules.auth.dto.LoginRequest;
import com.eventflow.modules.auth.dto.RefreshTokenRequest;
import com.eventflow.modules.auth.dto.RegisterRequest;
import com.eventflow.modules.auth.dto.ResetPasswordRequest;
import com.eventflow.modules.user.dto.UserResponse;
import com.eventflow.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @PostMapping("/register")
    public ApiResponse<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok("Registered successfully", authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Logged in successfully", authService.login(request));
    }

    @PostMapping("/refresh-token")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.ok("Token refreshed", authService.refresh(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@AuthenticationPrincipal UserPrincipal principal) {
        authService.logout(principal.id());
        return ApiResponse.ok("Logged out", null);
    }

    @GetMapping("/verify-email")
    public RedirectView verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return new RedirectView(frontendUrl + "/login?verified=true");
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ApiResponse.ok("If the email exists, a reset link will be sent", null);
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.ok("Password reset successfully", null);
    }
}
