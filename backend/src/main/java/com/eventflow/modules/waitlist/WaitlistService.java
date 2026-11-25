package com.eventflow.modules.waitlist;

import com.eventflow.common.enums.BookingStatus;
import com.eventflow.common.enums.EventStatus;
import com.eventflow.common.enums.SeatStatus;
import com.eventflow.common.exception.AppException;
import com.eventflow.common.exception.ResourceNotFoundException;
import com.eventflow.modules.booking.BookingRepository;
import com.eventflow.modules.booking.BookingService;
import com.eventflow.modules.booking.SeatLockService;
import com.eventflow.modules.booking.dto.LockSeatsRequest;
import com.eventflow.modules.event.Event;
import com.eventflow.modules.event.EventRepository;
import com.eventflow.modules.event.EventSeat;
import com.eventflow.modules.event.EventSeatRepository;
import com.eventflow.modules.notification.EmailService;
import com.eventflow.modules.user.UserRepository;
import com.eventflow.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WaitlistService {
    record View(boolean canJoin, String status, Long position, UUID bookingId, LocalDateTime expiresAt, Long remainingSeconds) { }

    private final WaitlistRepository waitlist;
    private final EventRepository events;
    private final EventSeatRepository seats;
    private final BookingService bookings;
    private final BookingRepository records;
    private final SeatLockService locks;
    private final UserRepository users;
    private final EmailService email;

    @Transactional(readOnly = true)
    public View view(UserPrincipal principal, UUID eventId) {
        var event = events.findById(eventId).orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        return view(event, waitlist.findTopByEvent_IdAndUser_IdOrderByJoinedAtDesc(eventId, principal.id()).orElse(null));
    }

    @Transactional
    public View join(UserPrincipal principal, UUID eventId) {
        var event = events.lockById(eventId).orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        var entry = waitlist.findTopByEvent_IdAndUser_IdOrderByJoinedAtDesc(eventId, principal.id()).orElse(null);
        if (entry != null && (entry.getStatus() == WaitlistEntry.Status.WAITING || entry.getStatus() == WaitlistEntry.Status.OFFERED)) return view(event, entry);
        if (!eligible(event) || availableSeat(eventId) != null) {
            throw new AppException(HttpStatus.CONFLICT, "WAITLIST_UNAVAILABLE", "Join the waitlist when the event has no available seats");
        }
        var created = new WaitlistEntry();
        created.setEvent(event);
        created.setUser(users.findById(principal.id()).orElseThrow());
        created.setJoinedAt(LocalDateTime.now());
        created.setStatus(WaitlistEntry.Status.WAITING);
        return view(event, waitlist.save(created));
    }

    @Transactional
    public View leave(UserPrincipal principal, UUID eventId) {
        var event = events.findById(eventId).orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        var recent = waitlist.findTopByEvent_IdAndUser_IdOrderByJoinedAtDesc(eventId, principal.id()).orElse(null);
        if (recent == null) return view(event, null);
        var entry = waitlist.lockById(recent.getId()).orElseThrow();
        if (entry.getStatus() == WaitlistEntry.Status.OFFERED) {
            bookings.release(principal, entry.getBooking().getId());
            if (entry.getBooking().getStatus() == BookingStatus.CONFIRMED) {
                entry.setStatus(WaitlistEntry.Status.CLAIMED);
                return view(event, entry);
            }
        }
        if (entry.getStatus() == WaitlistEntry.Status.WAITING || entry.getStatus() == WaitlistEntry.Status.OFFERED) {
            entry.setStatus(WaitlistEntry.Status.CANCELLED);
        }
        return view(event, entry);
    }

    @Transactional
    public void offer(UUID id) {
        var entry = waitlist.lockById(id).orElseThrow();
        if (entry.getStatus() != WaitlistEntry.Status.WAITING) return;
        if (!eligible(entry.getEvent())) {
            entry.setStatus(WaitlistEntry.Status.EXPIRED);
            return;
        }
        var seat = availableSeat(entry.getEvent().getId());
        if (seat == null) return;
        var booking = bookings.lockSeats(UserPrincipal.from(entry.getUser()),
                new LockSeatsRequest(entry.getEvent().getId(), List.of(seat.getId())));
        entry.setBooking(records.getReferenceById(booking.id()));
        entry.setStatus(WaitlistEntry.Status.OFFERED);
    }

    @Transactional
    public void updateOffer(UUID id) {
        var entry = waitlist.lockById(id).orElseThrow();
        if (entry.getStatus() != WaitlistEntry.Status.OFFERED) return;
        var booking = entry.getBooking();
        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            entry.setStatus(WaitlistEntry.Status.CLAIMED);
        } else if (booking.getStatus() != BookingStatus.PENDING || !booking.getExpiresAt().isAfter(LocalDateTime.now())) {
            entry.setStatus(WaitlistEntry.Status.EXPIRED);
        } else if (entry.getNotifiedAt() == null &&
                email.sendWaitlistOffer(entry.getUser().getEmail(), entry.getEvent().getTitle(), booking.getId())) {
            entry.setNotifiedAt(LocalDateTime.now());
        }
    }

    private View view(Event event, WaitlistEntry entry) {
        boolean canJoin = eligible(event) && availableSeat(event.getId()) == null;
        if (entry == null) return new View(canJoin, null, null, null, null, null);
        if (entry.getStatus() == WaitlistEntry.Status.WAITING) {
            return new View(false, "WAITING", 1 + waitlist.countByEvent_IdAndStatusAndJoinedAtBefore(
                    event.getId(), WaitlistEntry.Status.WAITING, entry.getJoinedAt()), null, null, null);
        }
        var booking = entry.getBooking();
        if (entry.getStatus() == WaitlistEntry.Status.OFFERED && booking != null) {
            long left = Duration.between(LocalDateTime.now(), booking.getExpiresAt()).toSeconds();
            if (booking.getStatus() == BookingStatus.CONFIRMED) return new View(false, "CLAIMED", null, booking.getId(), null, null);
            if (booking.getStatus() == BookingStatus.PENDING && left > 0) {
                return new View(false, "OFFERED", null, booking.getId(), booking.getExpiresAt(), left);
            }
            return new View(canJoin, "EXPIRED", null, null, null, null);
        }
        return new View(canJoin, entry.getStatus().name(), null, null, null, null);
    }

    private boolean eligible(Event event) {
        return event.getStatus() == EventStatus.PUBLISHED && Boolean.TRUE.equals(event.getPublicEvent())
                && event.getEventDate().isAfter(LocalDateTime.now());
    }

    private EventSeat availableSeat(UUID eventId) {
        return seats.findByEvent_Id(eventId).stream()
                .filter(seat -> seat.getStatus() == SeatStatus.AVAILABLE && !locks.isLocked(eventId, seat.getId()))
                .findFirst().orElse(null);
    }
}
