package com.eventflow.modules.admin;

import com.eventflow.common.PageResponse;
import com.eventflow.common.enums.EventStatus;
import com.eventflow.common.enums.UserRole;
import com.eventflow.modules.booking.dto.BookingResponse;
import com.eventflow.modules.event.dto.EventResponse;
import com.eventflow.modules.user.dto.UserResponse;
import org.springframework.data.domain.Pageable;

import java.util.Map;
import java.util.UUID;

public interface AdminService {
    PageResponse<UserResponse> users(UserRole role, Pageable pageable);

    UserResponse updateUserRole(UUID userId, UserRole role);

    UserResponse updateUserStatus(UUID userId, boolean active);

    PageResponse<EventResponse> events(EventStatus status, Pageable pageable);

    EventResponse approveEvent(UUID eventId, String note);

    EventResponse rejectEvent(UUID eventId, String reason);

    PageResponse<BookingResponse> bookings(Pageable pageable);

    Map<String, Object> revenueAnalytics();

    Map<String, Object> occupancyAnalytics(UUID eventId);
}

