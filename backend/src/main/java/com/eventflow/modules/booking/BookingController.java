package com.eventflow.modules.booking;

import com.eventflow.common.ApiResponse;
import com.eventflow.common.PageResponse;
import com.eventflow.modules.booking.dto.BookingResponse;
import com.eventflow.modules.booking.dto.ConfirmBookingRequest;
import com.eventflow.modules.booking.dto.LockSeatsRequest;
import com.eventflow.modules.booking.dto.LockStatusResponse;
import com.eventflow.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/lock")
    public ApiResponse<BookingResponse> lockSeats(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody LockSeatsRequest request) {
        return ApiResponse.ok("Seats locked", bookingService.lockSeats(principal, request));
    }

    @PostMapping("/{id}/confirm")
    public ApiResponse<BookingResponse> confirm(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, @Valid @RequestBody ConfirmBookingRequest request) {
        return ApiResponse.ok("Booking confirmed", bookingService.confirm(principal, id, request));
    }

    @DeleteMapping("/{id}/release")
    public ApiResponse<Void> release(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        bookingService.release(principal, id);
        return ApiResponse.ok("Seats released", null);
    }

    @GetMapping("/my")
    public ApiResponse<PageResponse<BookingResponse>> myBookings(@AuthenticationPrincipal UserPrincipal principal, Pageable pageable) {
        return ApiResponse.ok(bookingService.myBookings(principal, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<BookingResponse> detail(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return ApiResponse.ok(bookingService.detail(principal, id));
    }

    @GetMapping("/{id}/lock-status")
    public ApiResponse<LockStatusResponse> lockStatus(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return ApiResponse.ok(bookingService.lockStatus(principal, id));
    }

    @PostMapping("/{id}/extend-lock")
    public ApiResponse<LockStatusResponse> extendLock(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return ApiResponse.ok("Lock extended", bookingService.extendLock(principal, id));
    }
}

