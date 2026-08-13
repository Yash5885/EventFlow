package com.eventflow.modules.user;

import com.eventflow.common.ApiResponse;
import com.eventflow.modules.user.dto.ChangePasswordRequest;
import com.eventflow.modules.user.dto.UpdateProfileRequest;
import com.eventflow.modules.user.dto.UserResponse;
import com.eventflow.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ApiResponse<UserResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(userService.getMe(principal.id()));
    }

    @PutMapping("/me")
    public ApiResponse<UserResponse> updateMe(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.ok("Profile updated", userService.updateMe(principal.id(), request));
    }

    @PutMapping("/me/password")
    public ApiResponse<Void> changePassword(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(principal.id(), request);
        return ApiResponse.ok("Password updated", null);
    }
}

