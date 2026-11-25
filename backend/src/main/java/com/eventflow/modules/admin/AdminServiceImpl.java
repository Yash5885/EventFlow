package com.eventflow.modules.admin;

import com.eventflow.common.PageResponse;
import com.eventflow.common.enums.EventStatus;
import com.eventflow.common.enums.UserRole;
import com.eventflow.common.exception.ResourceNotFoundException;
import com.eventflow.modules.booking.BookingRepository;
import com.eventflow.modules.booking.dto.BookingResponse;
import com.eventflow.modules.event.Event;
import com.eventflow.modules.event.EventRepository;
import com.eventflow.modules.event.dto.EventResponse;
import com.eventflow.modules.user.User;
import com.eventflow.modules.user.UserRepository;
import com.eventflow.modules.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final BookingRepository bookingRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> users(UserRole role, Pageable pageable) {
        var page = role == null ? userRepository.findAll(pageable) : userRepository.findByRole(role, pageable);
        return PageResponse.from(page.map(UserResponse::from));
    }

    @Override
    @Transactional
    public UserResponse updateUserRole(UUID userId, UserRole role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setRole(role);
        return UserResponse.from(user);
    }

    @Override
    @Transactional
    public UserResponse updateUserStatus(UUID userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setActive(active);
        return UserResponse.from(user);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<EventResponse> events(EventStatus status, Pageable pageable) {
        var page = eventRepository.findAll(pageable).map(EventResponse::from);
        if (status == null) {
            return PageResponse.from(page);
        }
        var filtered = page.getContent().stream().filter(event -> event.status() == status).toList();
        return new PageResponse<>(filtered, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    @Override
    @Transactional
    public EventResponse approveEvent(UUID eventId, String note) {
        Event event = findEvent(eventId);
        event.setStatus(EventStatus.PUBLISHED);
        event.setPublicEvent(true);
        event.setAdminNote(note);
        return EventResponse.from(event);
    }

    @Override
    @Transactional
    public EventResponse rejectEvent(UUID eventId, String reason) {
        Event event = findEvent(eventId);
        event.setStatus(EventStatus.DRAFT);
        event.setAdminNote(reason);
        return EventResponse.from(event);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BookingResponse> bookings(Pageable pageable) {
        return PageResponse.from(bookingRepository.findAll(pageable).map(BookingResponse::from));
    }

    @Override
    public Map<String, Object> revenueAnalytics() {
        return Map.of("grossRevenue", 0, "currency", "INR", "note", "Revenue aggregation pending");
    }

    @Override
    public Map<String, Object> occupancyAnalytics(UUID eventId) {
        return Map.of("eventId", eventId, "occupancyRate", 0, "note", "Occupancy aggregation pending");
    }

    private Event findEvent(UUID eventId) {
        Event event = eventRepository.lockById(eventId).orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        if (event.getStatus() != EventStatus.PENDING_APPROVAL) {
            throw new com.eventflow.common.exception.ValidationAppException("NOT_IN_REVIEW", "Only a submitted event can be reviewed");
        }
        return event;
    }
}
