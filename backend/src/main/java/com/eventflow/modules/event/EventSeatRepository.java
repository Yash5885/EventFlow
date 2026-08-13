package com.eventflow.modules.event;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventSeatRepository extends JpaRepository<EventSeat, UUID> {
    List<EventSeat> findByEvent_Id(UUID eventId);

    Optional<EventSeat> findByIdAndEvent_Id(UUID id, UUID eventId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select es from EventSeat es where es.id = :id")
    Optional<EventSeat> lockById(@Param("id") UUID id);
}
