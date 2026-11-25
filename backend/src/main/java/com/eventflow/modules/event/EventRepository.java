package com.eventflow.modules.event;

import com.eventflow.common.enums.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface EventRepository extends JpaRepository<Event, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Event e where e.id = :id")
    Optional<Event> lockById(UUID id);

    @EntityGraph(attributePaths = {"venue", "organizer"})
    Page<Event> findByStatusAndPublicEventTrue(EventStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"venue", "organizer"})
    @Query("""
            select e from Event e join e.venue v
            where e.status = :status and e.publicEvent = true
              and (:city = '' or lower(v.city) = :city)
              and (:category = '' or lower(e.category) = :category)
              and (:q = '' or locate(:q, lower(e.title)) > 0
                           or locate(:q, lower(v.name)) > 0
                           or locate(:q, lower(v.city)) > 0)
            order by e.eventDate, e.id
            """)
    Page<Event> searchPublished(EventStatus status, String city, String category, String q, Pageable pageable);

    List<Event> findTop100ByVenue_Manager_IdAndStatusOrderByEventDateAsc(UUID managerId, EventStatus status);

    @EntityGraph(attributePaths = {"venue", "organizer"})
    Page<Event> findByOrganizer_Id(UUID organizerId, Pageable pageable);
}
