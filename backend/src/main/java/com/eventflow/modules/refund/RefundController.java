package com.eventflow.modules.refund;

import com.eventflow.common.ApiResponse;
import com.eventflow.security.UserPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class RefundController {
    private final RefundService refunds;
    public record Request(@NotBlank @Size(max = 500) String reason) { }
    public record Review(@NotNull Boolean approve, @Size(max = 500) String note) { }

    @GetMapping("/api/v1/bookings/refunds")
    public ApiResponse<List<RefundService.View>> history(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(refunds.history(principal));
    }

    @PostMapping("/api/v1/bookings/{id}/refund")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ApiResponse<RefundService.View> request(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id,
                                                   @Valid @RequestBody Request request) {
        return ApiResponse.ok(refunds.request(principal, id, request.reason()));
    }

    @GetMapping("/api/v1/admin/refunds")
    public ApiResponse<List<RefundService.View>> queue() { return ApiResponse.ok(refunds.queue()); }

    @PostMapping("/api/v1/admin/refunds/{id}/review")
    public ApiResponse<RefundService.View> review(@PathVariable UUID id, @Valid @RequestBody Review review) {
        return ApiResponse.ok(refunds.review(id, review.approve(), review.note()));
    }
}
