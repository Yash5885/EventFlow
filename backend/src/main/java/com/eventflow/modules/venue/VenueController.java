package com.eventflow.modules.venue;

import com.eventflow.common.ApiResponse;
import com.eventflow.common.PageResponse;
import com.eventflow.modules.venue.dto.BulkCreateSeatsRequest;
import com.eventflow.modules.venue.dto.CreateVenueRequest;
import com.eventflow.modules.venue.dto.SeatResponse;
import com.eventflow.modules.venue.dto.UpdateSeatRequest;
import com.eventflow.modules.venue.dto.UpdateVenueRequest;
import com.eventflow.modules.venue.dto.VenueDetailResponse;
import com.eventflow.modules.venue.dto.VenueResponse;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/venues")
@RequiredArgsConstructor
public class VenueController {

    private final VenueService venueService;

    @PostMapping
    public ApiResponse<VenueResponse> create(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody CreateVenueRequest request) {
        return ApiResponse.ok("Venue created", venueService.create(principal, request));
    }

    @GetMapping
    public ApiResponse<PageResponse<VenueResponse>> list(@RequestParam(required = false) String city, Pageable pageable) {
        return ApiResponse.ok(venueService.list(city, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<VenueDetailResponse> detail(@PathVariable UUID id) {
        return ApiResponse.ok(venueService.detail(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<VenueResponse> update(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, @Valid @RequestBody UpdateVenueRequest request) {
        return ApiResponse.ok("Venue updated", venueService.update(principal, id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        venueService.delete(id);
        return ApiResponse.ok("Venue deleted", null);
    }

    @PostMapping("/{id}/seats/bulk")
    public ApiResponse<List<SeatResponse>> bulkCreateSeats(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, @Valid @RequestBody BulkCreateSeatsRequest request) {
        return ApiResponse.ok("Seats created", venueService.bulkCreateSeats(principal, id, request));
    }

    @GetMapping("/{id}/seats")
    public ApiResponse<List<SeatResponse>> listSeats(@PathVariable UUID id) {
        return ApiResponse.ok(venueService.listSeats(id));
    }

    @PutMapping("/{id}/seats/{seatId}")
    public ApiResponse<SeatResponse> updateSeat(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, @PathVariable UUID seatId, @Valid @RequestBody UpdateSeatRequest request) {
        return ApiResponse.ok("Seat updated", venueService.updateSeat(principal, id, seatId, request));
    }

    @DeleteMapping("/{id}/seats/{seatId}")
    public ApiResponse<Void> deleteSeat(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, @PathVariable UUID seatId) {
        venueService.deleteSeat(principal, id, seatId);
        return ApiResponse.ok("Seat deleted", null);
    }
}

