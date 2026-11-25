package com.eventflow.modules.waitlist;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDateTime;

interface WaitlistRepository extends JpaRepository<WaitlistEntry, UUID> {
    Optional<WaitlistEntry> findTopByEvent_IdAndUser_IdOrderByJoinedAtDesc(UUID event, UUID user);

    @Query(value = "select distinct on (event_id) id from event_waitlist where status = 'WAITING' order by event_id, joined_at, id", nativeQuery = true)
    List<UUID> queueHeads(Pageable pageable);

    @Query("select w.id from WaitlistEntry w where w.status = :status order by w.joinedAt")
    List<UUID> activeOffers(WaitlistEntry.Status status, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from WaitlistEntry w where w.id = :id")
    Optional<WaitlistEntry> lockById(UUID id);

    long countByEvent_IdAndStatusAndJoinedAtBefore(UUID event, WaitlistEntry.Status status, LocalDateTime joinedAt);
}
