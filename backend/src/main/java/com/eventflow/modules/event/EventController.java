package com.eventflow.modules.event;

import com.eventflow.common.ApiResponse;
import com.eventflow.common.PageResponse;
import com.eventflow.modules.event.dto.CreateEventRequest;
import com.eventflow.modules.event.dto.EventDetailResponse;
import com.eventflow.modules.event.dto.EventResponse;
import com.eventflow.modules.event.dto.EventSummaryResponse;
import com.eventflow.modules.event.dto.SeatMapResponse;
import com.eventflow.modules.event.dto.UpdateEventRequest;
import com.eventflow.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping
    public ApiResponse<EventResponse> create(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody CreateEventRequest request) {
        return ApiResponse.ok("Event created", eventService.create(principal, request));
    }

    @GetMapping
    public ApiResponse<PageResponse<EventSummaryResponse>> list(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String category,
            Pageable pageable
    ) {
        return ApiResponse.ok(eventService.listPublished(city, category, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<EventDetailResponse> detail(@PathVariable UUID id) {
        return ApiResponse.ok(eventService.detail(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<EventResponse> update(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, @Valid @RequestBody UpdateEventRequest request) {
        return ApiResponse.ok("Event updated", eventService.update(principal, id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        eventService.delete(principal, id);
        return ApiResponse.ok("Event deleted", null);
    }

    @PostMapping("/{id}/submit")
    public ApiResponse<EventResponse> submit(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return ApiResponse.ok("Event submitted for approval", eventService.submit(principal, id));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<EventResponse> cancel(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, @RequestBody(required = false) Map<String, String> body) {
        return ApiResponse.ok("Event cancelled", eventService.cancel(principal, id, body == null ? null : body.get("reason")));
    }

    @GetMapping("/{id}/seat-map")
    public ApiResponse<SeatMapResponse> seatMap(@PathVariable UUID id) {
        return ApiResponse.ok(eventService.seatMap(id));
    }

    @GetMapping("/my")
    public ApiResponse<PageResponse<EventSummaryResponse>> myEvents(@AuthenticationPrincipal UserPrincipal principal, Pageable pageable) {
        return ApiResponse.ok(eventService.myEvents(principal, pageable));
    }
}

