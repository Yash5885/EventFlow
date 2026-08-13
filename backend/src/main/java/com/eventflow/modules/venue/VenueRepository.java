package com.eventflow.modules.venue;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface VenueRepository extends JpaRepository<Venue, UUID> {
    Page<Venue> findByCityIgnoreCaseAndActiveTrue(String city, Pageable pageable);

    Page<Venue> findByActiveTrue(Pageable pageable);
}

