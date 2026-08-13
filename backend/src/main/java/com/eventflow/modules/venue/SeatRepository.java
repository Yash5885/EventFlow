package com.eventflow.modules.venue;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SeatRepository extends JpaRepository<Seat, UUID> {
    List<Seat> findByVenue_IdAndActiveTrueOrderByRowLabelAscSeatNumberAsc(UUID venueId);
}
