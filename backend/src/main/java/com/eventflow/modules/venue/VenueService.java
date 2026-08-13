package com.eventflow.modules.venue;

import com.eventflow.common.PageResponse;
import com.eventflow.modules.venue.dto.BulkCreateSeatsRequest;
import com.eventflow.modules.venue.dto.CreateVenueRequest;
import com.eventflow.modules.venue.dto.SeatResponse;
import com.eventflow.modules.venue.dto.UpdateSeatRequest;
import com.eventflow.modules.venue.dto.UpdateVenueRequest;
import com.eventflow.modules.venue.dto.VenueDetailResponse;
import com.eventflow.modules.venue.dto.VenueResponse;
import com.eventflow.security.UserPrincipal;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface VenueService {
    VenueResponse create(UserPrincipal principal, CreateVenueRequest request);

    PageResponse<VenueResponse> list(String city, Pageable pageable);

    VenueDetailResponse detail(UUID id);

    VenueResponse update(UserPrincipal principal, UUID id, UpdateVenueRequest request);

    void delete(UUID id);

    List<SeatResponse> bulkCreateSeats(UserPrincipal principal, UUID venueId, BulkCreateSeatsRequest request);

    List<SeatResponse> listSeats(UUID venueId);

    SeatResponse updateSeat(UserPrincipal principal, UUID venueId, UUID seatId, UpdateSeatRequest request);

    void deleteSeat(UserPrincipal principal, UUID venueId, UUID seatId);
}

