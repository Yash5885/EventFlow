package com.eventflow.modules.admin;

import com.eventflow.common.ApiResponse;
import com.eventflow.common.PageResponse;
import com.eventflow.common.enums.EventStatus;
import com.eventflow.common.enums.UserRole;
import com.eventflow.modules.booking.dto.BookingResponse;
import com.eventflow.modules.event.dto.EventResponse;
import com.eventflow.modules.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ApiResponse<PageResponse<UserResponse>> users(@RequestParam(required = false) UserRole role, Pageable pageable) {
        return ApiResponse.ok(adminService.users(role, pageable));
    }

    @PutMapping("/users/{id}/role")
    public ApiResponse<UserResponse> updateRole(@PathVariable UUID id, @RequestBody Map<String, UserRole> body) {
        return ApiResponse.ok("Role updated", adminService.updateUserRole(id, body.get("role")));
    }

    @PutMapping("/users/{id}/status")
    public ApiResponse<UserResponse> updateStatus(@PathVariable UUID id, @RequestBody Map<String, Boolean> body) {
        return ApiResponse.ok("Status updated", adminService.updateUserStatus(id, Boolean.TRUE.equals(body.get("isActive"))));
    }

    @GetMapping("/events")
    public ApiResponse<PageResponse<EventResponse>> events(@RequestParam(required = false) EventStatus status, Pageable pageable) {
        return ApiResponse.ok(adminService.events(status, pageable));
    }

    @PostMapping("/events/{id}/approve")
    public ApiResponse<EventResponse> approve(@PathVariable UUID id, @RequestBody(required = false) Map<String, String> body) {
        return ApiResponse.ok("Event approved", adminService.approveEvent(id, body == null ? null : body.get("note")));
    }

    @PostMapping("/events/{id}/reject")
    public ApiResponse<EventResponse> reject(@PathVariable UUID id, @RequestBody(required = false) Map<String, String> body) {
        return ApiResponse.ok("Event rejected", adminService.rejectEvent(id, body == null ? null : body.get("reason")));
    }

    @GetMapping("/bookings")
    public ApiResponse<PageResponse<BookingResponse>> bookings(Pageable pageable) {
        return ApiResponse.ok(adminService.bookings(pageable));
    }

    @GetMapping("/analytics/revenue")
    public ApiResponse<Map<String, Object>> revenue() {
        return ApiResponse.ok(adminService.revenueAnalytics());
    }

    @GetMapping("/analytics/occupancy")
    public ApiResponse<Map<String, Object>> occupancy(@RequestParam(required = false) UUID eventId) {
        return ApiResponse.ok(adminService.occupancyAnalytics(eventId));
    }
}

