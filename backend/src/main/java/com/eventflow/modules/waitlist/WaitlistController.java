package com.eventflow.modules.waitlist;

import com.eventflow.common.ApiResponse;
import com.eventflow.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
@RequestMapping("/api/v1/waitlist/events")
public class WaitlistController {
    private final WaitlistService waitlist;

    @GetMapping("/{eventId}")
    public ApiResponse<WaitlistService.View> view(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID eventId) {
        return ApiResponse.ok(waitlist.view(principal, eventId));
    }

    @PostMapping("/{eventId}")
    public ApiResponse<WaitlistService.View> join(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID eventId) {
        return ApiResponse.ok(waitlist.join(principal, eventId));
    }

    @DeleteMapping("/{eventId}")
    public ApiResponse<WaitlistService.View> leave(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID eventId) {
        return ApiResponse.ok(waitlist.leave(principal, eventId));
    }
}
