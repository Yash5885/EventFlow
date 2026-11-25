package com.eventflow.modules.event;

import com.eventflow.common.PageResponse;
import com.eventflow.modules.event.dto.CreateEventRequest;
import com.eventflow.modules.event.dto.EventDetailResponse;
import com.eventflow.modules.event.dto.EventResponse;
import com.eventflow.modules.event.dto.EventSummaryResponse;
import com.eventflow.modules.event.dto.SeatMapResponse;
import com.eventflow.modules.event.dto.UpdateEventRequest;
import com.eventflow.security.UserPrincipal;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface EventService {
    EventResponse create(UserPrincipal principal, CreateEventRequest request);

    PageResponse<EventSummaryResponse> listPublished(String city, String category, String q, Pageable pageable);

    EventDetailResponse detail(UserPrincipal principal, UUID id);

    EventResponse update(UserPrincipal principal, UUID id, UpdateEventRequest request);

    void delete(UserPrincipal principal, UUID id);

    EventResponse submit(UserPrincipal principal, UUID id);

    EventResponse cancel(UserPrincipal principal, UUID id, String reason);

    SeatMapResponse seatMap(UserPrincipal principal, UUID eventId);

    PageResponse<EventSummaryResponse> myEvents(UserPrincipal principal, Pageable pageable);
}
