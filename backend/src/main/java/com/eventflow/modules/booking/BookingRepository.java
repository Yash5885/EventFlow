package com.eventflow.modules.booking;

import com.eventflow.common.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Booking b where b.id = :id")
    Optional<Booking> lockById(UUID id);

    @Query("select b.id from Booking b where b.status = :status and b.ticketEmailSentAt is null and b.bookedAt >= :since order by b.bookedAt")
    List<UUID> findTicketEmailQueue(BookingStatus status, LocalDateTime since, Pageable pageable);

    @Query(value = "select exists (select 1 from event_waitlist where booking_id = :id)", nativeQuery = true)
    boolean isWaitlistHold(UUID id);

    Page<Booking> findByUser_Id(UUID userId, Pageable pageable);

    @Query("select b.id from Booking b where b.status = :status and b.expiresAt <= :now order by b.expiresAt, b.id")
    List<UUID> findPendingExpiryIds(BookingStatus status, LocalDateTime now, Pageable pageable);

    List<Booking> findByStatusAndExpiresAtBefore(BookingStatus status, LocalDateTime now);

    @EntityGraph(attributePaths = {"items", "items.eventSeat", "items.eventSeat.event"})
    List<Booking> findWithItemsByStatusAndExpiresAtBefore(BookingStatus status, LocalDateTime now);
}
