package com.eventflow.modules.ticket;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;
import com.eventflow.common.enums.BookingStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    List<Ticket> findByBooking_Id(UUID bookingId);

    @Query("select t from Ticket t where t.booking.status = :status and (t.holder.id = :userId or (t.holder is null and t.booking.user.id = :userId))")
    Page<Ticket> findForHolder(UUID userId, BookingStatus status, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Ticket t where t.id = :id")
    Optional<Ticket> lockById(UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Ticket t where t.transferHash = :hash")
    Optional<Ticket> lockByTransferHash(String hash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Ticket t where t.booking.id = :bookingId order by t.id")
    List<Ticket> lockForBooking(UUID bookingId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Ticket t where t.ticketCode = :code")
    Optional<Ticket> lockByCode(String code);

    long countByBooking_Event_IdAndBooking_Status(UUID eventId, BookingStatus status);

    long countByBooking_Event_IdAndBooking_StatusAndUsedTrue(UUID eventId, BookingStatus status);
}
