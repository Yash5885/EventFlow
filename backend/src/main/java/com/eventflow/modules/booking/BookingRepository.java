package com.eventflow.modules.booking;

import com.eventflow.common.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {
    Page<Booking> findByUser_Id(UUID userId, Pageable pageable);

    List<Booking> findByStatusAndExpiresAtBefore(BookingStatus status, LocalDateTime now);

    @EntityGraph(attributePaths = {"items", "items.eventSeat", "items.eventSeat.event"})
    List<Booking> findWithItemsByStatusAndExpiresAtBefore(BookingStatus status, LocalDateTime now);
}
