package com.eventflow.modules.event;

import com.eventflow.common.enums.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface EventRepository extends JpaRepository<Event, UUID> {
    @EntityGraph(attributePaths = {"venue", "organizer"})
    Page<Event> findByStatusAndPublicEventTrue(EventStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"venue", "organizer"})
    Page<Event> findByOrganizer_Id(UUID organizerId, Pageable pageable);
}
