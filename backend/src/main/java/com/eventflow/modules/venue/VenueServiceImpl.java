package com.eventflow.modules.venue;

import com.eventflow.common.PageResponse;
import com.eventflow.common.enums.UserRole;
import com.eventflow.common.exception.AppException;
import com.eventflow.common.exception.ResourceNotFoundException;
import com.eventflow.modules.user.User;
import com.eventflow.modules.user.UserRepository;
import com.eventflow.modules.venue.dto.BulkCreateSeatsRequest;
import com.eventflow.modules.venue.dto.CreateVenueRequest;
import com.eventflow.modules.venue.dto.SeatResponse;
import com.eventflow.modules.venue.dto.UpdateSeatRequest;
import com.eventflow.modules.venue.dto.UpdateVenueRequest;
import com.eventflow.modules.venue.dto.VenueDetailResponse;
import com.eventflow.modules.venue.dto.VenueResponse;
import com.eventflow.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VenueServiceImpl implements VenueService {

    private final VenueRepository venueRepository;
    private final SeatRepository seatRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public VenueResponse create(UserPrincipal principal, CreateVenueRequest request) {
        User manager = userRepository.findById(principal.id())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Venue venue = Venue.builder()
                .manager(manager)
                .name(request.name())
                .address(request.address())
                .city(request.city())
                .state(request.state())
                .pincode(request.pincode())
                .totalCapacity(request.totalCapacity())
                .description(request.description())
                .layoutConfig(request.layoutConfig())
                .build();
        return VenueResponse.from(venueRepository.save(venue));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<VenueResponse> list(String city, Pageable pageable) {
        var page = StringUtils.hasText(city)
                ? venueRepository.findByCityIgnoreCaseAndActiveTrue(city, pageable)
                : venueRepository.findByActiveTrue(pageable);
        return PageResponse.from(page.map(VenueResponse::from));
    }

    @Override
    @Transactional(readOnly = true)
    public VenueDetailResponse detail(UUID id) {
        Venue venue = findVenue(id);
        return VenueDetailResponse.from(
                VenueResponse.from(venue),
                seatRepository.findByVenue_IdAndActiveTrueOrderByRowLabelAscSeatNumberAsc(id).stream().map(SeatResponse::from).toList()
        );
    }

    @Override
    @Transactional
    public VenueResponse update(UserPrincipal principal, UUID id, UpdateVenueRequest request) {
        Venue venue = findVenue(id);
        assertOwnerOrAdmin(principal, venue);
        if (StringUtils.hasText(request.name())) venue.setName(request.name());
        if (request.address() != null) venue.setAddress(request.address());
        if (request.city() != null) venue.setCity(request.city());
        if (request.state() != null) venue.setState(request.state());
        if (request.pincode() != null) venue.setPincode(request.pincode());
        if (request.totalCapacity() != null) venue.setTotalCapacity(request.totalCapacity());
        if (request.description() != null) venue.setDescription(request.description());
        if (request.layoutConfig() != null) venue.setLayoutConfig(request.layoutConfig());
        if (request.active() != null) venue.setActive(request.active());
        return VenueResponse.from(venue);
    }

    @Override
    public void delete(UUID id) {
        venueRepository.delete(findVenue(id));
    }

    @Override
    @Transactional
    public List<SeatResponse> bulkCreateSeats(UserPrincipal principal, UUID venueId, BulkCreateSeatsRequest request) {
        Venue venue = findVenue(venueId);
        assertOwnerOrAdmin(principal, venue);
        List<Seat> seats = request.seats().stream()
                .map(seat -> Seat.builder()
                        .venue(venue)
                        .rowLabel(seat.rowLabel())
                        .seatNumber(seat.seatNumber())
                        .seatType(seat.seatType())
                        .xPosition(seat.xPosition())
                        .yPosition(seat.yPosition())
                        .build())
                .toList();
        return seatRepository.saveAll(seats).stream().map(SeatResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SeatResponse> listSeats(UUID venueId) {
        findVenue(venueId);
        return seatRepository.findByVenue_IdAndActiveTrueOrderByRowLabelAscSeatNumberAsc(venueId).stream()
                .map(SeatResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public SeatResponse updateSeat(UserPrincipal principal, UUID venueId, UUID seatId, UpdateSeatRequest request) {
        Venue venue = findVenue(venueId);
        assertOwnerOrAdmin(principal, venue);
        Seat seat = seatRepository.findById(seatId)
                .filter(candidate -> candidate.getVenue().getId().equals(venueId))
                .orElseThrow(() -> new ResourceNotFoundException("Seat not found"));
        if (StringUtils.hasText(request.rowLabel())) seat.setRowLabel(request.rowLabel());
        if (request.seatNumber() != null) seat.setSeatNumber(request.seatNumber());
        if (request.seatType() != null) seat.setSeatType(request.seatType());
        if (request.xPosition() != null) seat.setXPosition(request.xPosition());
        if (request.yPosition() != null) seat.setYPosition(request.yPosition());
        if (request.active() != null) seat.setActive(request.active());
        return SeatResponse.from(seat);
    }

    @Override
    @Transactional
    public void deleteSeat(UserPrincipal principal, UUID venueId, UUID seatId) {
        Venue venue = findVenue(venueId);
        assertOwnerOrAdmin(principal, venue);
        Seat seat = seatRepository.findById(seatId)
                .filter(candidate -> candidate.getVenue().getId().equals(venueId))
                .orElseThrow(() -> new ResourceNotFoundException("Seat not found"));
        seatRepository.delete(seat);
    }

    private Venue findVenue(UUID id) {
        return venueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found"));
    }

    private void assertOwnerOrAdmin(UserPrincipal principal, Venue venue) {
        boolean admin = principal.role() == UserRole.ADMIN;
        boolean owner = venue.getManager().getId().equals(principal.id());
        if (!admin && !owner) {
            throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You do not manage this venue");
        }
    }
}
