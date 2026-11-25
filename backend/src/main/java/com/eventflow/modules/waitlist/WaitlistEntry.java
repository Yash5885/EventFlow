package com.eventflow.modules.waitlist;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.eventflow.modules.booking.Booking;
import com.eventflow.modules.event.Event;
import com.eventflow.modules.user.User;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "event_waitlist")
@Getter
@Setter
public class WaitlistEntry {
    enum Status { WAITING, OFFERED, CLAIMED, EXPIRED, CANCELLED }

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "booking_id")
    private Booking booking;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private Status status;

    @Column(name = "notified_at")
    private LocalDateTime notifiedAt;
}
